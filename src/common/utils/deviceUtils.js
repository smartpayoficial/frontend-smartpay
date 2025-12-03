/**
 * Mapea el estado en el que se encuentra el dispositivo (bloqueado, desbloqueado, etc.)
 * basándose en su historial de acciones.
 * @param {Array} plans - Lista de planes/dispositivos.
 * @param {Array} actions - Historial de acciones de los dispositivos.
 * @returns {Array} Una nueva lista de planes enriquecida con el estado de acción más reciente.
 */
export function mapPlansWithLatestAction(plans, actions) {
    return plans.map(plan => {
        const relevantActions = actions.filter(action =>
            action.device_id === plan.device_id &&
            (action.action === 'block' || action.action === 'unblock' || action.action === 'unenroll')
        );

        const latestAction = relevantActions.reduce((latest, current) => {
            return !latest || new Date(current.created_at) > new Date(latest.created_at)
                ? current
                : latest;
        }, null);

        return {
            ...plan,
            status_actions: latestAction,
        };
    });
}