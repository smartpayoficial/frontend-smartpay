/**
 * Función para obtener la fecha de proximo pago
 * @paymetns Recibe el @array de payments 
 * @startDateSrt Fecha Inicial del primer pago
 * @perdioDays Periodo de Dias de pago
 */
export function getEffectivePaymentDate(payments, startDateStr, periodDays) {
    console.log("Calculando fecha efectiva...", { payments, startDateStr, periodDays });

    // 1. Filtrar los pagos: Solo Aprobados Y que NO sean la "Cuota inicial"
    const periodicPayments = payments.filter(p => {
        // Verificar estado
        if (p.state !== 'Approved') return false;

        // Verificar descripción (para ignorar la cuota inicial)
        // Usamos optional chaining (?.) por seguridad y toLowerCase para evitar errores de mayúsculas
        const description = p.description?.toLowerCase() || '';

        // Si la descripción contiene "inicial", NO lo contamos
        return !description.includes('inicial');
    });

    // 2. Contar cuántos pagos de cuotas REALES (periódicas) existen
    const approvedPaymentsCount = periodicPayments.length;

    // 3. Calcular días a sumar
    // Lógica: Si la startDate es el 29 Dic (Cuota 1) y hay 1 pago (Cuota 1),
    // sumamos 1 periodo (9 días) para obtener la fecha de la Cuota 2.
    const daysToAdd = approvedPaymentsCount * periodDays;

    // 4. Calcular la nueva fecha
    // Nota: Usamos la fecha tal cual viene en string para evitar conversiones raras de zona horaria
    const startDate = new Date(startDateStr);

    // Creamos una copia para manipular
    const effectiveDate = new Date(startDate);

    // Sumamos los días usando UTC para evitar problemas de horario de verano/cambio de hora
    effectiveDate.setUTCDate(startDate.getUTCDate() + daysToAdd);

    // 5. Retornar en formato YYYY-MM-DD
    return effectiveDate.toISOString().split('T')[0];
}