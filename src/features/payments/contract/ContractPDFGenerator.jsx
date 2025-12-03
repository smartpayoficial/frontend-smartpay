import React, { useRef, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { CURRENCIES } from '../../../common/utils/currencies'; // Importa las divisas
import { formatDisplayDate } from '../../../common/utils/helpers';
import './styles/contract-style.css';

import html2pdf from 'html2pdf.js';

const formatNumberToWords = (number) => {
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (number === 0) return 'cero';
  if (number < 10) return units[number];
  if (number < 20) return teens[number - 10];
  if (number < 100) {
    const unit = number % 10;
    const ten = Math.floor(number / 10);
    return unit === 0 ? tens[ten] : `${tens[ten]} y ${units[unit]}`;
  }
  if (number < 1000) {
    const hundred = Math.floor(number / 100);
    const remainder = number % 100;
    return remainder === 0 ? hundreds[hundred] : `${hundreds[hundred]} ${formatNumberToWords(remainder)}`;
  }
  if (number < 1000000) {
    const thousand = Math.floor(number / 1000);
    const remainder = number % 1000;
    const thousandText = thousand === 1 ? 'mil' : `${formatNumberToWords(thousand)} mil`;
    return remainder === 0 ? thousandText : `${thousandText} ${formatNumberToWords(remainder)}`;
  }
  return 'número muy grande';
};


const ContractPDFGenerator = ({
  // Company information
  ruc = '2065074545',
  companyName = 'SMARTPAY INCLUSION RENTABLE S.A.C',
  companyAddress = 'CALLE MARAÑON # 367',
  representativeName = 'JUAN CARLOS DIAZ DACOSTA',
  representativeDNI = '48794319',
  representativePhone = '925608708',
  representativeEmail = '-',
  representativeAccountBack = 'No registrada. Solicitar en la Tienda',
  // Borrower information
  borrowerName = '',
  borrowerDNI = '',
  borrowerPhone = '',
  borrowerEmail = '',
  borrowerAddress = '',

  interestRate = 0,

  devicePrice = 0,
  paymentPlan = {
    quotas: 0,
    frecuencia_dias: 0,
    initial_date: '',
    monto_cuota: 0,
    balance_to_finance: 0,
    currency: 'COP'
  },
  initialPayment = {
    value: 0,
    method: '',
    date: ''
  },
  generatedInstallments = [],

  equipment = {
    brand: '',
    model: '',
    imei: ''
  },


  contractDate = new Date(),

}) => {
  const contractRef = useRef(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  const contractPrincipal = paymentPlan.balance_to_finance;
  const contractMonths = paymentPlan.quotas;
  const contractMonthlyPayment = paymentPlan.monto_cuota;
  const contractCurrency = paymentPlan.currency;


  const formatCurrency = useCallback((amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return '';
    }
    const currencyConfig = CURRENCIES[contractCurrency];
    if (!currencyConfig) {
      console.warn(`Configuración para la divisa ${contractCurrency} no encontrada.`);
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(numericAmount);
    }
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: contractCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  }, [contractCurrency]);
  // const generatePDF1 = async () => {
  //   if (!contractRef.current) return;

  //   setIsLoadingContract(true);
  //   try {
  //     const originalPadding = contractRef.current.style.padding;
  //     const originalMargin = contractRef.current.style.margin;
  //     const originalWidth = contractRef.current.style.width;
  //     const originalBoxSizing = contractRef.current.style.boxSizing;

  //     const margin = 25;


  //     contractRef.current.style.padding = `${margin}mm`;
  //     contractRef.current.style.margin = '0';
  //     contractRef.current.style.width = '210mm';
  //     contractRef.current.style.boxSizing = 'border-box';

  //     const canvas = await html2canvas(contractRef.current, {
  //       scale: 1.8,
  //       useCORS: true,
  //       allowTaint: true,
  //       scrollX: 0,
  //       scrollY: 0,
  //     });

  //     const imgData = canvas.toDataURL('image/jpeg');

  //     const pdf = new jsPDF('p', 'mm', 'a4');

  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = pdf.internal.pageSize.getHeight();

  //     const imgWidth = canvas.width;
  //     const imgHeight = canvas.height;

  //     const ratio = pdfWidth / imgWidth;
  //     const scaledImgHeight = imgHeight * ratio;

  //     let heightLeft = scaledImgHeight;
  //     let position = 0;

  //     let pageNum = 1;

  //     while (heightLeft > -1) {
  //       if (pageNum > 1) {
  //         pdf.addPage();
  //       }

  //       pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledImgHeight);

  //       pdf.setFillColor(255, 255, 255);
  //       pdf.rect(0, 0, pdfWidth, margin, 'F');
  //       pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');

  //       heightLeft -= pdfHeight;
  //       position -= pdfHeight;
  //       pageNum++;
  //     }

  //     contractRef.current.style.padding = originalPadding;
  //     contractRef.current.style.margin = originalMargin;
  //     contractRef.current.style.width = originalWidth;
  //     contractRef.current.style.boxSizing = originalBoxSizing;

  //     const dateStr = contractDate.toISOString().split('T')[0];
  //     const filename = `contrato_${borrowerDNI}_${dateStr}.pdf`;

  //     pdf.save(filename);

  //   } catch (error) {
  //     console.error('Error generating PDF:', error);
  //     alert('Error al generar el PDF. Por favor, intente nuevamente.');
  //   } finally {
  //     setIsLoadingContract(false);
  //   }
  // };

  const generatePDF = async () => {
    if (!contractRef.current) return;

    setIsLoadingContract(true);

    try {
      const element = contractRef.current;

      const opt = {
        margin: [10, 7, 10, 7], // top, left, bottom, right
        filename: `contrato_${borrowerDNI}_${contractDate.toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error al generar PDF', err);
      alert('Ocurrió un error al generar el PDF.');
    } finally {
      setIsLoadingContract(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(CURRENCIES[contractCurrency]?.locale || 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCurrentDate = () => {
    const now = new Date(contractDate);
    return {
      day: now.getDate().toString().padStart(2, '0'),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear().toString()
    };
  };

  const currentDate = getCurrentDate();

  const totalPayableAmount = devicePrice;

  console.log("Datos",equipment);
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 text-center">
        <button
          onClick={generatePDF}
          disabled={isLoadingContract}
          className={`inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-white font-semibold transition-colors duration-200
                    ${isLoadingContract ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
        >
          {isLoadingContract ? (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <DocumentArrowDownIcon className="-ml-0.5 mr-2 h-5 w-5" />
          )}
          {isLoadingContract ? 'Generando...' : 'Generar PDF del Contrato'}
        </button>
      </div>


      <div
        ref={contractRef}
        className="bg-white shadow-lg p-8 text-sm leading-relaxed"
        style={{ fontFamily: 'Times New Roman, serif' }}
      >

        <div className="mb-8 section-to-print">
          <h2 className="text-lg font-bold text-center mb-4">MODELO DE CARTA DE INSTRUCCIÓN</h2>
          <div className="mb-4">
            <p>Señor {companyName}</p>
            <p>Presente.</p>
            <p>-</p>
          </div>
          <div className="mb-4">
            <p>De mi consideración:</p>
            <p className="text-justify">
              Me refiero al pagaré incompleto adjunto, emitido por mi persona a la orden de {companyName} (en adelante,
              el "Tenedor"), con fecha {currentDate.day}/{currentDate.month}/{currentDate.year} (en adelante, el "Pagaré").
            </p>
          </div>
          <div className="text-justify space-y-2">
            <p>
              Al respecto, por medio de la presente les autorizo irrevocablemente, conforme al artículo 10º de la Ley de Títulos
              Valores (Ley No. 27287), a completar el Pagaré indicando su fecha de vencimiento conforme a lo siguiente:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                El Pagaré es el Pagaré a que se refiere la Cláusula Décimo Sétima del Contrato de Préstamo de fecha
                {currentDate.day}/{currentDate.month}/{currentDate.year}, suscrito entre {companyName} (en calidad de prestamista), y mi persona (en
                calidad de prestatario) (en adelante, el "Contrato"), y podrá ser transferido mediante endoso.
              </li>
              <li>
                El Pagaré sólo podrá ser completado por ustedes en caso ocurra un Incumplimiento del Contrato.
              </li>
              <li>
                La fecha de vencimiento del Pagaré que ustedes quedan autorizados a completar mediante esta carta será la fecha
                en que el Prestamista efectúe la declaración de incumplimiento y exigibilidad de los montos pendientes de pago
                bajo el Contrato luego de ocurrido el incumplimiento a que se refiere el acápite 2. de la presente carta.
              </li>
              <li>
                El monto del Pagaré, que ustedes completarán, será aquél que se derive de la liquidación que efectúe el
                Prestamista del íntegro de mi deuda para con dicha entidad al momento de la declaración de vencimiento y
                exigibilidad de los montos pendientes de pago bajo el Contrato e intereses aplicables.
              </li>
              <li>
                Para efectos de completar el Pagaré bastará, exclusivamente, lo establecido en la presente comunicación, no siendo
                necesario para ello ningún pronunciamiento o resolución alguna por parte de cualquier autoridad judicial,
                administrativa o de cualquier otra naturaleza, sea previo, simultáneo o posterior.
              </li>
              <li>
                Declaro de manera expresa que entiendo y conozco los mecanismos de protección que la ley otorga para la emisión
                o aceptación de títulos valores incompletos.
              </li>
            </ol>
          </div>
          <div className="mt-6">
            <p>Sin otro particular, quedo de ustedes.</p>
            <p className="mt-4">Atentamente,</p>
            <div className="mt-8 border-b-2 border-black w-64"></div>
            <p className="mt-2">NOMBRE: {borrowerName}</p>
            <p>DNI: {borrowerDNI}</p>
          </div>
        </div>

        {/* Main Contract */}
        {/* <div className="mb-8 section-to-print" style={{ pageBreakBefore: 'always' }}> */}
        <div className="mb-8 section-to-print" >
          <h1 className="text-xl font-bold text-center mb-6">CONTRATO DE PRÉSTAMO</h1>
          <div className="text-justify mb-6">
            <p>
              {companyName}, identificado con RUC {ruc}, con domicilio en {companyAddress}, debidamente
              representada por su Gerente General, el Sr. {representativeName}, identificado con DNI {representativeDNI}, según poderes
              inscritos en la Partida Electrónica # 1175152 del Registros de Personas Jurídicas de LA OFICINA REGISTRAL DE TARAPOTO, a quien
              en adelante se le denominará ADELANTOS; y por el otro lado, la persona identificada en el Anexo 1 del presente CONTRATO, a
              quien en adelante se le denominará el PRESTATARIO y, en su conjunto con ADELANTOS se les denominará las "PARTES".
            </p>
          </div>
          <div className="text-justify mb-6">
            <p>
              Las PARTES acuerdan suscribir el presente CONTRATO DE PRÉSTAMO (en adelante, el "CONTRATO") bajo los siguientes
              términos y condiciones:
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">PRIMERA: ANTECEDENTES</h3>
              <div className="ml-4 space-y-2">
                <p>1.1. ADELANTOS es una persona jurídica de derecho privado, constituida bajo el régimen de la sociedad anónima cerrada, que
                  tiene como objeto social principal la adquisición y reventa de equipos de telefonía móvil celular, así como el financiamiento de
                  compra de equipos de telefonía móvil celular.</p>
                <p>1.2. El PRESTATARIO es una persona natural de nacionalidad peruana y con Documento Nacional de Identidad vigente, el cual
                  ha obtenido una calificación satisfactoria ante la evaluación crediticia requerida por ADELANTOS.</p>
                <p>1.3. El PRESTATARIO está interesado en la adquisición del equipo de telefonía celular detallado en el Anexo 1 del presente
                  CONTRATO (en adelante, el "EQUIPO"), para destinarlo a su uso personal y familiar. En ese sentido, el PRESTATARIO declara que
                  no tiene previsto utilizar el EQUIPO para fines profesionales ni laborales.</p>
                <p>1.4. El PRESTATARIO ha solicitado a ADELANTOS un mutuo dinerario, por el monto detallado en la "Hoja Resumen" contenida
                  en el Anexo 1 del presente CONTRATO (en adelante, la "HOJA RESUMEN") con el fin de adquirir el EQUIPO.</p>
                <p>1.5. ADELANTOS ha decidido aprobar la solicitud de crédito y le otorga el mutuo dinerario solicitado conforme a los términos
                  y condiciones establecidas en el presente CONTRATO.</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold">SEGUNDA: OBJETO</h3>
              <div className="ml-4 text-justify">
                <p>
                  A través del presente CONTRATO, ADELANTOS otorga un crédito en favor del PRESTATARIO, por la cantidad indicada en el
                  Anexo 1 del presente CONTRATO (en adelante el "CRÉDITO"), obligándose este último a restituir a ADELANTOS el importe principal
                  del CRÉDITO más los intereses, comisiones, gastos y cualquier otro cargo aplicable hasta el pago total del mismo, que se
                  encuentran debidamente detallados en la HOJA RESUMEN y en el cronograma de pago anexos, los cuales forman parte
                  integrante de este CONTRATO.
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-bold">DÉCIMO OCTAVA: ACEPTACIÓN</h3>
              <div className="ml-4 text-justify">
                <p>
                  Declaran las PARTES que han leído, entendido y aceptado en su totalidad, sin reclamo ni objeción alguna, los
                  términos y condiciones establecidos en el presente CONTRATO. EN FE DE LO CUAL se suscriben, hoy día: {currentDate.day} mes: {currentDate.month} año: {currentDate.year}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Signatures and Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 section-to-print">
          <div>
            <h3 className="font-bold mb-4">DATOS DEL PRESTATARIO</h3>
            <p><strong>CONTACTO:</strong> {representativeName}</p>
            <p><strong>TELEFONO:</strong> {representativePhone}</p>
            <p><strong>CORREO:</strong> {representativeEmail}</p>
            <p><strong>DIRECCION:</strong> {companyAddress}</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">ADELANTOS COMPRADOR</h3>
            <p><strong>NOMBRE COMPLETO:</strong> {borrowerName}</p>
            <p><strong>DNI:</strong> {borrowerDNI}</p>
            <p><strong>TELEFONO CELULAR:</strong> {borrowerPhone}</p>
            <p><strong>CORREO:</strong> {borrowerEmail}</p>
            <p><strong>DIRECCION:</strong> {borrowerAddress}</p>
          </div>
        </div>

        {/* NEW: Credit Details */}
        <div className="mb-8 section-to-print">
          <h3 className="font-bold mb-4">DETALLE DEL CRÉDITO</h3>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>VALOR DEL DISPOSITIVO:</strong> {formatCurrency(devicePrice)}</p>
            <p><strong>PAGO INICIAL:</strong> {formatCurrency(initialPayment.value)}</p>
            <p><strong>FECHA DE PAGO INICIAL:</strong> {formatDate(initialPayment.date)}</p>
            <p><strong>MONTO A FINANCIAR:</strong> {formatCurrency(contractPrincipal)}</p>
            <p><strong>NÚMERO DE CUOTAS:</strong> {contractMonths}</p>
            <p><strong>MONTO POR CUOTA:</strong> {formatCurrency(contractMonthlyPayment)}</p>
            {/* Puedes agregar la frecuencia si lo necesitas aquí, por ejemplo: */}
            <p><strong>FRECUENCIA DE CUOTAS:</strong> Cada {paymentPlan.frecuencia_dias} días</p>
            {/* Si tienes una tasa de interés del plan de pagos, puedes añadirla aquí */}
            {interestRate > 0 && <p><strong>TASA DE INTERÉS DEL CRÉDITO:</strong> {interestRate}%</p>}
          </div>
        </div>

        {/* NEW: Generated Installments Table */}
        {generatedInstallments.length > 0 && (
          <div className="mb-8 section-to-print">
            <h3 className="font-bold mb-4">CRONOGRAMA DE PAGO DEL CRÉDITO</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">CUOTA</th>
                    <th className="border border-gray-300 p-2">FECHA DE VENCIMIENTO</th>
                    <th className="border border-gray-300 p-2">MONTO ({contractCurrency})</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedInstallments.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2 text-center">{row.number}</td>
                      <td className="border border-gray-300 p-2 text-center">{formatDisplayDate(new Date(row.dueDate), false, false)}</td>
                      <td className="border border-gray-300 p-2 text-right">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                  {/* Opcional: Fila para el total a financiar */}
                  <tr>
                    <td colSpan="2" className="border border-gray-300 p-2 text-right font-semibold">TOTAL FINANCIADO:</td>
                    <td className="border border-gray-300 p-2 text-right font-semibold">{formatCurrency(contractPrincipal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="mb-8 section-to-print">
          <h3 className="font-bold mb-4">MÉTODOS DE PAGO</h3>
          <div className="space-y-2">
            <p>
              <strong>ENTIDAD BANCARIA:</strong>{' '}
              {representativeAccountBack.length > 0
                ? representativeAccountBack[0].name
                : '--'}
            </p>
            {/* <p><strong>CAJA PIURA:</strong> 210-01-2683375</p> */}
            <p>
              <strong>NÚMERO DE CUENTA:</strong>{' '}
              {representativeAccountBack.length > 0
                ? representativeAccountBack[0].value
                : '--'}
            </p>
            <p><strong>PAGO EN EFECTIVO A TIENDA COBRADOR</strong></p>
          </div>
        </div>

        {/* Equipment Details */}
        <div className="mb-8 section-to-print">
          <h3 className="font-bold mb-4">DETALLES DEL EQUIPO</h3>
          <div className="grid grid-cols-3 gap-4">
            <p><strong>MARCA:</strong> {equipment.brand}</p>
            <p><strong>MODELO:</strong> {equipment.model}</p>
            <p><strong>{equipment.deviceId ? "IMEI:" : "SERIAL:"}</strong> {equipment.imei}</p>
          </div>
        </div>

        {/* Promissory Note */}
        {/* <div className="mb-8 section-to-print" style={{ pageBreakBefore: 'always' }}> */}
        <div className="mb-8 section-to-print" >
          <h3 className="font-bold text-center mb-4">ANEXO 2 - MODELO DE PAGARÉ</h3>
          <div className="text-center mb-4">
            <p><strong>NUMERO:</strong> 20221102989886</p>
            <h4 className="font-bold text-lg">PAGARÉ</h4>
            <p>POR: {formatCurrency(totalPayableAmount)}</p> {/* Usar el valor total del dispositivo */}
            <p>VENCE EL: {currentDate.day} / {currentDate.month} / {currentDate.year}</p>
          </div>

          <div className="text-justify space-y-2">
            <p>
              Yo, {borrowerName}, identificado con DNI N° {borrowerDNI}, con domicilio
              para estos efectos en {borrowerAddress} (el "Deudor"), debo y me obligo a pagar incondicionalmente a la orden y disposición de {companyName}, identificada
              con RUC {ruc} (el "Tenedor") o a quien éste hubiera transferido este Pagaré, la suma de {formatCurrency(totalPayableAmount)}
              ({formatNumberToWords(Math.floor(totalPayableAmount))} y {((totalPayableAmount % 1) * 100).toFixed(0).padStart(2, '0')}/100 {CURRENCIES[contractCurrency]?.name || 'Unidades Monetarias'}), y que al vencimiento del presente Pagaré nos obligamos a
              entregar en esta ciudad, mediante fondos disponibles de inmediato y en la misma moneda, en la siguiente cuenta
              bancaria: BCP Cta Cte Soles N° 55090856523098 (CCI 00255019085652309827).
            </p>
            <p>
              En caso de no ser pagado el monto debido bajo este Pagaré en la fecha de su vencimiento, nos obligamos a
              abonar los intereses moratorios a la tasa máxima permitida legalmente, que se devengará automáticamente desde la
              fecha de vencimiento de este Pagaré hasta el día de su pago total más gastos notariales, costos y costas judiciales y
              extrajudiciales incurridos por el Tenedor en razón de nuestro incumplimiento.
            </p>
          </div>

          <div className="mt-8 text-center">
            <div className="border-b-2 border-black w-64 mx-auto mb-2"></div>
            <p><strong>FIRMA:</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPDFGenerator;