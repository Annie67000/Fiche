from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from ldap3 import ALL, Connection, Server
from ldap3.core.exceptions import LDAPBindError, LDAPException

from .models import Employe


class LDAPUnavailable(Exception):
    pass


def _connect(user=None, password=None):
    server = Server(settings.LDAP_SERVER_URI, get_info=ALL, connect_timeout=5)
    return Connection(
        server,
        user=user,
        password=password,
        auto_bind=True,
        receive_timeout=5,
    )


def authenticate_ldap(email, password):
    """Bind anonymously-via-service to find DN, then bind as the user.

    Returns a dict of LDAP attributes on success, or None on bad credentials.
    Raises LDAPUnavailable if the directory cannot be reached.
    """
    if not email or not password:
        return None

    search_filter = settings.LDAP_USER_SEARCH_FILTER.format(email=email)
    attrs = list(settings.LDAP_ATTR_MAP.keys())

    try:
        service = _connect(settings.LDAP_BIND_DN, settings.LDAP_BIND_PASSWORD)
    except LDAPBindError as exc:
        raise LDAPUnavailable(f'service bind failed: {exc}') from exc
    except LDAPException as exc:
        raise LDAPUnavailable(str(exc)) from exc

    try:
        service.search(
            search_base=settings.LDAP_USER_SEARCH_BASE,
            search_filter=search_filter,
            attributes=attrs,
        )
        if not service.entries:
            return None
        entry = service.entries[0]
        user_dn = entry.entry_dn
        result = {key: _first(entry, key) for key in attrs}
        result['dn'] = user_dn
        result['email'] = result.get('mail') or email
    finally:
        service.unbind()

    try:
        user_conn = _connect(user_dn, password)
    except LDAPBindError:
        return None
    except LDAPException as exc:
        raise LDAPUnavailable(str(exc)) from exc
    user_conn.unbind()

    return result


def _first(entry, attr):
    if attr not in entry:
        return None
    value = entry[attr].value
    if isinstance(value, list):
        return value[0] if value else None
    return value


@transaction.atomic
def sync_user_from_ldap(attrs):
    """Upsert auth_user + Employe from LDAP attributes. Returns (user, employe)."""
    email = (attrs.get('email') or attrs.get('mail') or '').strip().lower()
    uid = attrs.get('uid') or (email.split('@')[0] if email else None)
    matricule = attrs.get('employeeNumber') or uid
    given_name = attrs.get('givenName') or ''
    surname = attrs.get('sn') or ''
    if not given_name and attrs.get('cn'):
        parts = str(attrs['cn']).split(' ', 1)
        given_name = parts[0]
        if not surname and len(parts) > 1:
            surname = parts[1]

    user, _ = User.objects.get_or_create(
        username=uid or email,
        defaults={'email': email, 'first_name': given_name, 'last_name': surname},
    )
    user.email = email or user.email
    user.first_name = given_name or user.first_name
    user.last_name = surname or user.last_name
    user.set_unusable_password()
    user.save()

    employe, _ = Employe.objects.update_or_create(
        user=user,
        defaults={
            'matricule': matricule or (uid or email),
            'nom': surname or user.last_name,
            'prenom': given_name or user.first_name,
            'email': email or user.email,
            'departement': attrs.get('departmentNumber') or attrs.get('ou') or '',
            'poste': attrs.get('title') or '',
            'actif': True,
        },
    )
    return user, employe
