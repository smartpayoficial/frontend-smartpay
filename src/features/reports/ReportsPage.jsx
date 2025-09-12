
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ArrowDownTrayIcon, FunnelIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { downloadReport, getAnalytics } from '../../api/reports';
import { getCurrentStoreId } from '../../common/utils/helpers';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const ReportsPage = () => {
    const [reportType, setReportType] = useState('weekly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState([]);
    const [filteredData, setFilteredDataData] = useState([]);
    const [storeId, setStoreId] = useState(getCurrentStoreId());
    let queryFilters = {
        start_date: startDate,
        end_date: endDate,
        store_id: storeId,
    }

    /**
     * Cargar rango de fechas iniciales
     */
    useEffect(() => {
        const now = new Date();
        let fromDate = new Date();

        if (reportType === 'weekly') {
            fromDate.setDate(now.getDate() - 7);
        } else if (reportType === 'monthly') {
            fromDate.setMonth(now.getMonth() - 1);
        } else if (reportType === 'annual') {
            fromDate.setFullYear(now.getFullYear() - 1);
        }

        setStartDate(fromDate.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
    }, [reportType]);

    /**
     * Cargar estado según fecha inicial y final
     */
    useEffect(() => {
        if (!startDate || !endDate) return;

        const fetchData = async () => {
            const result = await getAnalytics(queryFilters);
            setData(result);
            setFilteredDataData(result.daily_data);
        };

        fetchData();
    }, [startDate, endDate]);

    const chartLabels = filteredData.map(item => item.date)
    const totalCustomers = data.total_customers
    const totalDevices =  data.total_devices
    const totalPayments = data.total_payments
    const totalVendor = data.total_vendors

    console.log('aaa: ', chartLabels);


    const barChartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Nuevos Clientes',
                data: filteredData.map(item => item.customers),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Dispositivos Activados',
                data: filteredData.map(item => item.devices),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            },
        ],
    };

    const pieChartData = {
        labels: ['Clientes', 'Dispositivos', 'Vendedores'],
        datasets: [
            {
                data: [totalCustomers, totalDevices, totalVendor],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Actividad Diaria',
            },
        },
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Distribución General de Métricas',
            },
        },
    };

    const exportToExcel = async () => {
        // const dataToExport = filteredData.map(item => ({
        //     Fecha: item.date,
        //     'Nuevos Clientes': item.customers,
        //     'Dispositivos Activados': item.devices,
        //     'Pagos Realizados (USD)': item.payments,
        //     'Vendedores Activos': item.vendors,
        // }));

        // if (dataToExport.length === 0) {
        //     alert("No hay datos para exportar.");
        //     return;
        // }

        // const ws = XLSX.utils.json_to_sheet(dataToExport);
        // const wb = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws, "Reporte");

        // const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        // const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });

        // const fileName = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        // saveAs(dataBlob, fileName);

        try {
            const response = await downloadReport(queryFilters);

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            // Obtener nombre de archivo desde headers si está presente
            const disposition = response.headers['content-disposition'];
            const match = disposition?.match(/filename="?(.+)"?/);
            const filename = match?.[1] || `reporte_${startDate}_${endDate}.xlsx`;

            saveAs(blob, filename);
        } catch (err) {
            console.error('Error al exportar:', err);
        }
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                {/* Título y Ícono */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center mb-4 sm:mb-0">
                    <ChartBarIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mr-2 text-indigo-600" />
                    <span className="truncate">Dashboard Smartpay</span>
                </h1>

                {/* Botón de Descarga */}
                <button
                    onClick={exportToExcel}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                    <ArrowDownTrayIcon className="-ml-0.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="ml-2 hidden sm:inline">Descargar Reporte Excel</span>
                    <span className="ml-2 inline sm:hidden">Descargar</span>
                </button>
            </div>

            {/* Controles de Filtrado */}
            <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FunnelIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Filtros de Reporte
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">Tipo de Reporte</label>
                        <select
                            id="report-type"
                            name="report-type"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="weekly">Semanal</option>
                            <option value="monthly">Mensual</option>
                            <option value="annual">Anual</option>
                            <option value="custom">Rango de Fechas Personalizado</option>
                        </select>
                    </div>
                    {reportType === 'custom' && (
                        <>
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                                <input
                                    type="date"
                                    id="start-date"
                                    name="start-date"
                                    className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                                <input
                                    type="date"
                                    id="end-date"
                                    name="end-date"
                                    className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <Bar options={barChartOptions} data={barChartData} />
                </div>
                <div className="bg-white shadow sm:rounded-lg p-6 flex justify-center items-center">
                    <div style={{ maxWidth: '400px', width: '100%' }}>
                        <Pie options={pieChartOptions} data={pieChartData} />
                    </div>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <CalendarDaysIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Detalle de Datos ({reportType})
                </h2>
                {filteredData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispositivos</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagos (USD)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedores</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.customers}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.devices}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.payments.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.vendors}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No hay datos disponibles para el filtro seleccionado.</p>
                )}
            </div>

        </div>
    );
};

export default ReportsPage;