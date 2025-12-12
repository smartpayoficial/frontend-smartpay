// src/utils/helpers.js

/**
 * Helper para tomar la store id del local storage
 */
export const getCurrentStoreId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.store?.id || null;
};

/**
 * Helper para tomar la store del local storage
 */
export const getCurrentStore = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.store || null;
};

/**
 * Helper para tomar la store del local storage
 */
export const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user || null;
};

/**
 * Capitaliza la primera letra de una cadena.
 * @param {string} string - La cadena de entrada.
 * @returns {string} La cadena con la primera letra capitalizada.
 */
export const capitalizeFirstLetter = (string) => {
    if (!string) {
        return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Formatea una fecha ISO a un formato legible.
 * @param {string} isoString - La cadena de fecha ISO.
 * @returns {string} La fecha formateada.
 */
export const formatDisplayDate = (
    isoString,
    showTime = false,
    longFormat = true,
    locale = 'es-CO',
) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);

        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }

        const baseOptions = longFormat
            ? {
                timeZone: 'UTC',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }
            : {
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            };

        const timeOptions = showTime
            ? {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }
            : {};

        return date.toLocaleString(locale, {
            ...baseOptions,
            ...timeOptions,
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'Fecha inválida';
    }
};


/**
 * Handle para inputs de texto PARA USUARIOS - CLIENTES y VENDEDORES 
 */
export const handleChangeHelper = (e, formData, setFormData, isNewCustomer) => {
    const { name, value } = e.target;

    if (name === 'prefix') {
        // Eliminar cualquier caracter no numérico o +
        let cleaned = value.replace(/[^\d+]/g, '');

        // Si no empieza por +, lo agregamos
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }

        // Quitar '+' duplicados en medio, por ejemplo: '++57' => '+57'
        cleaned = '+' + cleaned.slice(1).replace(/\+/g, '');

        // Tomar solo hasta 4 dígitos después del +
        cleaned = cleaned.slice(0, 5); // + y 4 dígitos máximo

        setFormData({
            ...formData,
            [name]: cleaned,
        });

        return;
    }

    setFormData((prev) => {
        const updated = {
            ...prev,
            [name]: value,
        };
        // Solo si es nuevo cliente y se está editando el DNI, actualiza también el password

        if (isNewCustomer && name === 'dni') {
            updated.username = value;
            updated.password = value;
        } else if (name === 'dni'){
            updated.username = value;
        }
        return updated;
    });
};

/**
 * Acceder a claves anidads para filtrado
 */
export const getValueByPath = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) || '';
};



/**
 * hora local
 */
export const localDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const localDate = `${yyyy}-${mm}-${dd}`;
    return localDate;
}

/**
 * Validar si es mobile 
 */
export const isMobile = () => {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};