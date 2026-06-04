'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import * as XLSX from 'xlsx';
import { Printer, FileSpreadsheet, X, FileText } from 'lucide-react';

interface ContractModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractModal({ clientId, isOpen, onClose }: ContractModalProps) {
  // 1. Obtener detalles del cliente (incluyendo el contractNumber y pagos)
  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['clientDetails', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await api.get(`/clients/${clientId}`);
      return response.data;
    },
    enabled: !!clientId && isOpen,
  });

  if (!isOpen) return null;

  // Formateadores de fecha
  const formatShortDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '______';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '______';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatLongDateSpanish = (dateStr: string | null | undefined) => {
    if (!dateStr) return '______';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '______';
    const day = date.getUTCDate();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${day} de ${monthName} del ${year}`;
  };

  const getPaymentMethodSpanish = (method: string | null | undefined) => {
    if (!method) return 'EFECTIVO';
    switch (method.toUpperCase()) {
      case 'CASH':
        return 'EFECTIVO';
      case 'CARD':
        return 'TARJETA';
      case 'TRANSFER':
        return 'BCP (TRANSFERENCIA)';
      default:
        return method;
    }
  };

  // Acciones de Exportación
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!client) return;

    const data = [
      ['CONTRATO DE PRESTACIONES DE SERVICIOS'],
      ['RUC: 2051051844 - rossyflowers SAC'],
      [`Contrato Nº: ${client.contractNumber || '______'}`],
      [],
      ['DATOS DE LA CONCESIONARIA'],
      ['Nombre', 'Florería Rossyflowers'],
      ['RUC', '2051051844'],
      ['Dirección', 'Calle Monte Real Nº 110'],
      [],
      ['DATOS DEL CLIENTE / RESPONSABLE'],
      ['Nombre Contacto', client.contactName || client.fullName],
      ['Teléfono', client.phone || 'N/A'],
      [],
      ['DATOS DEL SERVICIO'],
      ['Nombre del Difunto', client.fullName],
      ['Sector / Ubicación', `${client.sector?.name || 'Sin Sector'} ${client.address || ''}`],
      ['Detalle de Flores', client.flowers || 'N/A'],
      ['Fecha de Inicio', formatShortDate(client.lastPaymentDate)],
      ['Fecha de Vencimiento', formatShortDate(client.nextDueDate)],
      ['Monto del Servicio', `S/ ${client.amount ? client.amount.toFixed(2) : '0.00'}`],
      ['Método de Pago', getPaymentMethodSpanish(client.payments?.[0]?.paymentMethod)],
      ['Observaciones', client.remarks || 'N/A'],
      [],
      ['FECHA DE SUSCRIPCIÓN'],
      ['Fecha de firma', formatLongDateSpanish(client.lastPaymentDate || client.createdAt)],
      ['Lugar', 'Lima']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contrato');
    XLSX.writeFile(wb, `Contrato_${client.fullName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-overlay">
      {/* Estilos CSS globales inyectados dinámicamente solo para impresión */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Ocultar elementos estructurales de la pantalla original */
          .layout-root, .layout-content-wrapper, .layout-main-content {
            position: static !important;
            display: block !important;
            overflow: visible !important;
            width: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          
          /* Ocultar barras de navegación, botones y el fondo del modal */
          aside, header, nav, .modal-action-bar, .modal-backdrop-bg, button, svg {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hacer que el contenedor del modal cubra toda la página */
          .modal-backdrop-overlay {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Estilizar la caja del modal como contenedor plano invisible */
          .modal-box-container {
            position: static !important;
            display: block !important;
            max-height: none !important;
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          /* Asegurar que el body y html no tengan fondos oscuros ni scroll */
          html, body {
            background: white !important;
            color: black !important;
            overflow: visible !important;
            height: auto !important;
          }

          /* Posicionar el wrapper del contrato en la esquina superior */
          .printable-contract-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            visibility: visible !important;
          }

          .printable-contract-container * {
            visibility: visible !important;
            color: black !important;
            color-scheme: light !important;
          }

          .highlight-yellow-print {
            background-color: #fef08a !important; /* bg-yellow-200 */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: portrait;
            margin: 15mm;
          }
        }
      ` }} />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm modal-backdrop-bg print:hidden" onClick={onClose} />

      {/* Caja del Modal */}
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 modal-box-container">
        
        {/* Barra de Acciones del Modal */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0 modal-action-bar">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-foreground">Visor de Contrato</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {client && (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-95"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Excel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-secondary modal-close-btn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo / Visualizador del Contrato */}
        <div className="flex-1 overflow-y-auto pr-1 select-text scrollbar-thin">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : isError || !client ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
              No se pudo cargar la información del contrato del cliente.
            </div>
          ) : (
            <div className="printable-contract-container bg-white text-black p-8 md:p-12 rounded-xl shadow-inner border border-gray-100 max-w-3xl mx-auto font-sans leading-relaxed text-[12px] md:text-[13px]">
              
              {/* Encabezado Membretado */}
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                </div>
                <div className="text-right text-[10px] md:text-[11px] text-gray-700 leading-tight">
                  <p className="font-extrabold text-[12px] md:text-[13px] text-black">rossyflowers SAC: 2051051844</p>
                  <p className="font-semibold">Dirección: Calle Monte Real Nº 110</p>
                  <p className="font-semibold">Cementerio de Jardinez de la Paz La Molina (floreria Rossy Flowers)</p>
                </div>
              </div>

              <div className="text-left text-[10px] md:text-[11px] text-gray-500 italic mb-2 border-b border-black pb-1">
                Amamos lo que hacemos
              </div>

              {/* Título de Contrato y Número Correlativo */}
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-extrabold text-[13px] md:text-[14px] uppercase tracking-wide">
                  CONTRATO DE PRESTACIONES DE SERVICIOS
                </h4>
                <div className="text-[14px] md:text-[15px] font-extrabold text-red-600">
                  Nº {client.contractNumber || '______'}
                </div>
              </div>

              {/* Cuerpo del Contrato */}
              <div className="space-y-4 text-justify">
                <p>
                  Conste por el presente documento el Contrato Prestación de Servicios que celebran de una parte{' '}
                  <span className="font-bold">Florería Rossyflowers</span>, con R.U.C Nº{' '}
                  <span className="font-bold">2051051844</span>, a quien en adelante se le denominará{' '}
                  <span className="font-bold">LA CONCESIONARIA</span> y de la otra parte, el señor (a){' '}
                  <span className="font-bold">
                    {client.contactName?.trim() || client.fullName?.trim()}
                  </span>{' '}
                  con Nº de Teléfono <span className="font-bold">{client.phone || '______'}</span> al que en lo
                  sucesivo se le denominará <span className="font-bold">EL CLIENTE</span>, en los términos y condiciones
                  siguientes el amparo del Código Civil Vigente.
                </p>

                <p>
                  <span className="font-bold">CLAUSULA PRIMERA.- EL CLIENTE</span> contrata los servicios de{' '}
                  <span className="font-bold">LA CONCESIONARIA</span>, para efectos de la colocación de{' '}
                  <span className="font-bold">{client.flowers ? client.flowers.toUpperCase() : '______'}</span> para el
                  Sr(a): <span className="font-bold">{client.fullName ? client.fullName.toUpperCase() : '______'}</span>{' '}
                  Ubicado en el Sector{' '}
                  <span className="font-bold">
                    {client.sector?.name ? client.sector.name.toUpperCase() : '______'}
                  </span>{' '}
                  <span className="font-bold">{client.address ? client.address.toUpperCase() : ''}</span> del Parque
                  Cementerio Jardines de La Paz.
                </p>

                <p>
                  <span className="font-bold">CLAUSULA SEGUNDA.-</span> El servicio descrito se realizará los días{' '}
                  <span className="font-bold">{formatShortDate(client.lastPaymentDate)}</span> con fin{' '}
                  <span className="font-bold">{formatShortDate(client.nextDueDate)}</span> Observación:{' '}
                  <span className="font-bold">{client.remarks || 'Ninguna'}</span>.
                </p>

                <p>
                  <span className="font-bold">CLAUSULA TERCERA.-</span> La Concesionaria no se responsabiliza por la
                  extracción ilícita de las flores una vez colocada en el lugar indicado.
                  <br />
                  <span className="font-semibold italic text-[11px]">
                    *El precio estará sujeto a la variación del mercado.
                  </span>
                </p>

                <p>
                  <span className="font-bold">CLAUSULA CUARTA.-</span> De común acuerdo, se establece como pago del
                  servicio la suma de:{' '}
                  <span className="font-bold">S/ {client.amount ? client.amount.toFixed(2) : '0.00'}</span> con el
                  método de pago{' '}
                  <span className="font-bold">
                    {getPaymentMethodSpanish(client.payments?.[0]?.paymentMethod)}
                  </span>
                  .
                </p>

                <p className="pt-2">
                  En señal de conformidad, se suscribe el presente contrato el{' '}
                  <span className="font-bold bg-yellow-200 px-1.5 py-0.5 rounded highlight-yellow-print">
                    {formatLongDateSpanish(client.lastPaymentDate || client.createdAt)}
                  </span>{' '}
                  en la ciudad de Lima.
                </p>
              </div>

              {/* Firmas */}
              <div className="grid grid-cols-2 gap-12 pt-20 mt-12 text-center text-[11px]">
                <div className="flex flex-col items-center justify-end">
                  <p className="font-bold text-gray-800 mb-1">WILLIAM SANTANA</p>
                  <div className="w-48 border-b border-black border-dashed mb-2"></div>
                  <p className="font-bold text-gray-700">LA CONCESIONARIA</p>
                  <p className="text-gray-500">Florería Rossyflowers</p>
                  <p className="text-gray-500">Ruc: 2051051844</p>
                </div>
                
                <div className="flex flex-col items-center justify-end">
                  <div className="w-48 border-b border-black border-dashed mb-2"></div>
                  <p className="font-bold text-gray-700">EL CLIENTE</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
