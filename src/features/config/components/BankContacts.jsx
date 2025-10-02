import React, { useCallback, useEffect, useState } from 'react';
import { getContacts, createContact, updateContact, deleteContact, getAccountTypes } from '../../../api/stores';
import { getCurrentStore } from '../../../common/utils/helpers';

import EntityManager from './shared/EntityManger';
import ContactModal from './ContactModal';

function BankContacts() {
  const store = getCurrentStore();

  const [accountTypes, setAccountTypes] = useState([]);
  const [contactTypes, setContactTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);

  // ---------------- fetchers ----------------
  const fetcherAccounts = useCallback(async () => {
    const all = await getContacts();
    return all.filter(item =>
      ["BANK_ACCOUNT", "MOBILE_PAYMENT", "PAYMENT_GATEWAY"].includes(item.account_type?.category)
    );
  }, [store.id]);

  const fetcherContacts = useCallback(async () => {
    const all = await getContacts();
    return all.filter(item =>
      ["CONTACT", "PUBLIC_PROFILE"].includes(item.account_type?.category)
    );
  }, [store.id]);

  // ------------- cargar datos reales ----------------
  const loadAccounts = useCallback(async () => {
    const data = await fetcherAccounts();
    setAccounts(data);
  }, [fetcherAccounts]);

  const loadContacts = useCallback(async () => {
    const data = await fetcherContacts();
    setContacts(data);
  }, [fetcherContacts]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadContacts(); }, [loadContacts]);

  // ---------------- creators ----------------
  const creatorAccount = useCallback(async (contact) => {
    await createContact(store.id, { ...contact, type: "BANK_ACCOUNT" });
    await loadAccounts(); // refresca tabla y botón
  }, [store.id, loadAccounts]);

  const creatorContact = useCallback(async (contact) => {
    await createContact(store.id, { ...contact, type: "CONTACT" });
    await loadContacts(); // refresca tabla y botón
  }, [store.id, loadContacts]);

  // ---------------- updaters ----------------
  const updaterAccount = async (id, contact) => {
    await updateContact(id, { ...contact, type: "BANK_ACCOUNT" });
    await loadAccounts();
  };

  const updaterContact = async (id, contact) => {
    await updateContact(id, { ...contact, type: "CONTACT" });
    await loadContacts();
  };

  // ---------------- deleter ----------------
  const deleterAccount = async (id) => {
    await deleteContact(id);
    await loadAccounts();
  };

  const deleterContact = async (id) => {
    await deleteContact(id);
    await loadContacts();
  };

  // ---------------- columnas ----------------
  const columnsAccounts = [
    {
      label: 'Tipo de Cuenta',
      key: 'account_type_name',
      render: (item) => item.account_type?.name ?? '-'
    },
    {
      label: 'Número de Cuenta / Teléfono / Email',
      key: 'value',
      render: (item) => item.contact_details?.phone_number ?? item.contact_details?.account_number ?? item.contact_details?.email ?? '-'
    },
    {
      label: 'Titular / Nombre',
      key: 'holder_name',
      render: (item) => item.contact_details?.holder_name ?? item.name ?? '-'
    }
  ];

  const columnsContacts = [
    {
      label: 'Tipo de Contacto',
      key: 'account_type_name',
      render: (item) => item.account_type?.name ?? '-'
    },
    {
      label: 'Código',
      key: 'code',
      render: (item) => item.contact_details?.phone_code ?? '-'
    },
    {
      label: 'Contacto',
      key: 'value',
      render: (item) => item.contact_details?.phone_number ?? item.contact_details?.account_number ?? item.contact_details?.email ?? '-'
    }
  ];

  // ---------------- cargar tipos de cuenta/contacto ----------------
  useEffect(() => {
    const loadAccountTypes = async () => {
      try {
        const params = new URLSearchParams();
        params.append("country_id", store.country_id);
        params.append("categories", "PAYMENT_GATEWAY");
        params.append("categories", "BANK_ACCOUNT");
        params.append("categories", "MOBILE_PAYMENT");

        const data = await getAccountTypes(params);
        setAccountTypes(data);
      } catch (err) {
        console.error("Error cargando tipos de cuenta", err);
      }
    };

    const loadContactTypes = async () => {
      try {
        const params = new URLSearchParams();
        params.append("country_id", store.country_id);
        params.append("categories", "CONTACT");

        const data = await getAccountTypes(params);
        setContactTypes(data);
      } catch (err) {
        console.error("Error cargando tipos de contacto", err);
      }
    };

    loadAccountTypes();
    loadContactTypes();
  }, [store.country_id]);

  // ---------------- render ----------------
  return (
    <div>
      <div className="mb-8">
        <EntityManager
          title="Cuentas Bancarias y Métodos de Pago"
          fetcher={fetcherAccounts}
          creator={creatorAccount}
          updater={updaterAccount}
          deleter={deleterAccount}
          columns={columnsAccounts}
          ModalComponent={ContactModal}
          extraProps={{ accountTypes }}
          disableAddBtn={accounts.length >= 1} // depende de registros reales
        />
      </div>

      <EntityManager
        title="Contactos"
        fetcher={fetcherContacts}
        creator={creatorContact}
        updater={updaterContact}
        deleter={deleterContact}
        columns={columnsContacts}
        ModalComponent={ContactModal}
        extraProps={{ accountTypes: contactTypes }}
        disableAddBtn={contacts.length >= 1} // depende de registros reales
      />
    </div>
  );
}

export default BankContacts;
