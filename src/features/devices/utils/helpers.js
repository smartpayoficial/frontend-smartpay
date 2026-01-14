/**
 * Función para obtener la fecha de proximo pago
 * @paymetns Recibe el @array de payments 
 * @startDateSrt Fecha Inicial del primer pago
 * @perdioDays Periodo de Dias de pago
 */
export function getEffectivePaymentDate(payments, startDateStr, periodDays) {
    console.log(payments, startDateStr, periodDays);
    const paidDates = new Set(
        payments
            .filter(p => p.state === 'Approved')
            .map(p => new Date(p.date).toISOString().split('T')[0])
    );

    const startDate = new Date(startDateStr);
    let currentDate = new Date(startDate);

    currentDate.setDate(currentDate.getDate() + periodDays);

    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + periodDays);

    while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        if (!paidDates.has(dateStr)) {
            return dateStr;
        }

        currentDate.setDate(currentDate.getDate() + periodDays);
    }

    // throw new Error("No se encontró una fecha válida en el rango esperado.");
    console.error("No se encontró una fecha válida en el rango esperado.", "Current Date: ", currentDate, "maxDate: ", maxDate);
}