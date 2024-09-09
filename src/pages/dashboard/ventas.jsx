import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Select,
  Option,
  Switch,
} from "@material-tailwind/react";
import { PlusIcon, EyeIcon, TrashIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import 'jspdf-autotable';
import { Producir } from './Producir';
import { CrearVenta } from './CrearVenta'; // Importar el componente CrearVenta
import { GenerarInformeVenta } from './GenerarInformeVenta'; // Importar el componente para generar informe de ventas
import { ReporteVentas } from './ReporteVentas'; // Importamos el nuevo reporte de ventas

// Configuración de Toast
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [showCrearVenta, setShowCrearVenta] = useState(false); // Estado para mostrar/ocultar formulario de crear venta
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false); // Estado para controlar el modal de anulación
  const [motivoAnulacion, setMotivoAnulacion] = useState(''); // Estado para el motivo de anulación
  // Estado para controlar el formulario de informe
  const [mostrarReporteVentas, setMostrarReporteVentas] = useState(false); // Nuevo estado para manejar la visibilidad del reporte
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [ventaToCancel, setVentaToCancel] = useState(null); 
  const [productionOpen, setProductionOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState({
    id_cliente: "",
    numero_venta: "",
    fecha_venta: "",
    fecha_entrega: "",
    estado: "Pendiente de Preparación",
    pagado: true,
    detalleVentas: [],
    cliente: { nombre: "", contacto: "" },
    total: 0,
    subtotal: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [ventasPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchVentas();
    fetchClientes();
    fetchProductos();
    fetchPedidos();
  }, []);

  // Función para cancelar el informe
  const handleCancelarInforme = () => {
    setMostrarInforme(false);
  };

  const handleGenerarReporte = () => {
    setMostrarReporteVentas(true); // Activar la generación de reporte
  };

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      setVentas(response.data);
      setFilteredVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/clientes");
      setClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/productos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pedidos");
      const pedidosPendientes = response.data.filter(pedido => pedido.estado === "Pendiente de Preparación");
      setPedidos(pedidosPendientes);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    }
  };

  useEffect(() => {
    filterVentas();
  }, [search, startDate, endDate, ventas]);

  const filterVentas = () => {
    let filtered = ventas.filter((venta) =>
      venta.cliente.nombre.toLowerCase().includes(search.toLowerCase())
    );

    if (startDate && endDate) {
      filtered = filtered.filter(
        (venta) =>
          new Date(venta.fecha_venta) >= new Date(startDate) &&
          new Date(venta.fecha_venta) <= new Date(endDate)
      );
    }

    setFilteredVentas(filtered);
  };

  const handleViewDetails = (venta) => {
    const detallesFormateados = venta.detalles.map(detalle => ({
      ...detalle,
      precio_unitario: parseFloat(detalle.precio_unitario)
    }));

    setSelectedVenta({
      ...venta,
      detalleVentas: detallesFormateados,
      cliente: venta.cliente || { nombre: "", contacto: "" },
      fecha_venta: venta.fecha_venta.split('T')[0],
      subtotal: parseFloat(venta.total) / 1.19,
      total: parseFloat(venta.total)
    });
    setDetailsOpen(true);
  };

  const handleToggleActivo = async (id_venta, activo) => {
    const venta = ventas.find(v => v.id_venta === id_venta);
    if (!venta) {
        Swal.fire({
            icon: 'error',
            title: 'Venta no encontrada.',
        });
        return;
    }

    // Verificar si la venta ya está anulada o desactivada
    if (venta.anulacion || !venta.activo) {
        Swal.fire({
            icon: 'error',
            title: 'Operación no permitida.',
            text: 'Una venta anulada o desactivada no se puede volver a activar.',
        });
        return;
    }

    if (!activo) {
        // Si la venta está siendo anulada (activo === false), se solicita el motivo de anulación
        setVentaToCancel(id_venta);
        setCancelOpen(true);
    }
    // Eliminamos la opción de volver a activar
  };

  const handleCancelVenta = async () => {
    if (!motivoAnulacion.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Debe proporcionar un motivo de anulación.',
      });
      return;
    }

    try {
      await axios.patch(`http://localhost:3000/api/ventas/${ventaToCancel}/estado`, { 
        activo: false, 
        anulacion: motivoAnulacion 
      });
      fetchVentas();
      Swal.fire({
        icon: 'success',
        title: 'La venta ha sido anulada correctamente.',
      });
      setCancelOpen(false);
      setMotivoAnulacion('');
    } catch (error) {
      console.error("Error al anular la venta:", error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: `Hubo un problema al anular la venta: ${error.response?.data?.error || error.message}`,
      });
    }
  };

  const generatePDF = (venta) => {
    console.log("Generating PDF for:", venta);
  
    const doc = new jsPDF();
    doc.setFontSize(18);
  
    // Agregar el logo en la parte superior izquierda
    const logo = "/img/delicremlogo.png";
    doc.addImage(logo, "JPEG", 10, 10, 30, 15);
  
    // Título del PDF centrado, alineado verticalmente con el logo
    doc.setFontSize(20);
    doc.text('Comprobante de Venta', 105, 20, { align: 'center' });
  
    // Información general de la venta
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50); // Color gris oscuro para texto
    doc.text(`Número de Venta: ${venta.numero_venta}`, 20, 50);
    doc.text(`Fecha de Venta: ${new Date(venta.fecha_venta).toLocaleDateString()}`, 20, 58);
  
    // Información del cliente
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Negro para encabezados
    doc.text('Información del Cliente', 20, 75);
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80); // Gris para detalles del cliente
    doc.text(`Nombre: ${venta.cliente.nombre}`, 20, 85);
    doc.text(`Contacto: ${venta.cliente.contacto}`, 20, 93);
    doc.text(`Email: ${venta.cliente.email}`, 20, 101);
    doc.text(`Tipo de Documento: ${venta.cliente.tipo_documento}`, 20, 109);
    doc.text(`Número de Documento: ${venta.cliente.numero_documento}`, 20, 117);
  
    // Detalles de los productos
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Detalles de los Productos', 20, 135);
  
    const detalles = Array.isArray(venta.detalleVentas) ? venta.detalleVentas : 
                     (Array.isArray(venta.detalles) ? venta.detalles : []);
  
    // Agregar tabla con detalles de los productos
    doc.autoTable({
      startY: 145,
      head: [['ID Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
      body: detalles.map((detalle) => [
        detalle.id_producto,
        detalle.cantidad,
        `$${parseFloat(detalle.precio_unitario || 0).toFixed(2)}`,
        `$${(parseFloat(detalle.precio_unitario || 0) * parseInt(detalle.cantidad || 0)).toFixed(2)}`
      ]),
      theme: 'grid',
      styles: {
        fillColor: [230, 230, 230], // Color gris claro para el fondo de la tabla
        textColor: [0, 0, 0], // Negro para el texto
        lineColor: [2, 0, 0], // Negro para las líneas
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [174, 1, 126], // Color #AE017E para el encabezado
        textColor: [255, 255, 255], // Blanco para el texto del encabezado
      },
    });
  
    // Totales
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: $${parseFloat(venta.total).toFixed(2)}`, 140, doc.lastAutoTable.finalY + 20);
  
    // Información adicional
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50); // Gris oscuro para información adicional
    doc.text(`Fecha de Creación: ${new Date(venta.createdAt).toLocaleString()}`, 20, doc.internal.pageSize.height - 20);
    doc.text(`Última Actualización: ${new Date(venta.updatedAt).toLocaleString()}`, 20, doc.internal.pageSize.height - 10);
  
    doc.save(`Comprobante_Venta_${venta.numero_venta}.pdf`);
  };
  
  

  const indexOfLastVenta = currentPage * ventasPerPage; 
  const indexOfFirstVenta = indexOfLastVenta - ventasPerPage; 
  const currentVentas = filteredVentas.slice(indexOfFirstVenta, indexOfLastVenta);

  const pageNumbers = []; 
  for (let i = 1; i <= Math.ceil(filteredVentas.length / ventasPerPage); i++) { 
    pageNumbers.push(i); 
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100 shadow-md rounded-lg">
  <CardBody className="p-6">
    {/* Contenedor de botones principales */}
    <div className="flex items-center justify-between mb-6">
      <Button
        onClick={() => setShowCrearVenta(!showCrearVenta)}
        className="btnagregar"
        size="sm"
        startIcon={<PlusIcon />}
      >
        {showCrearVenta ? "Ocultar Crear Venta" : "Crear Venta"}
      </Button>
      <div className="flex items-center gap-4">
        <Button
          onClick={handleGenerarReporte}
          className="bg-black text-white hover:bg-pink-800 transition rounded px-4 py-2"
          size="sm"
        >
          Reporte
        </Button>
        <Button
          onClick={() => setMostrarInforme(true)}
          className="bg-black text-white hover:bg-pink-800 transition rounded px-4 py-2"
          size="sm"
        >
          Informe
        </Button>
      </div>
    </div>
  
    {!mostrarInforme ? (
  <>
    {showCrearVenta ? (
      <div className="mt-0 bg-white shadow-lg rounded-lg">     
        <CrearVenta
          clientes={clientes}
          productos={productos}
          pedidos={pedidos}
          fetchVentas={fetchVentas}
          onCancel={() => setShowCrearVenta(false)} // Cerrar el formulario
        />
        <div className="flex justify-end mt-6">
         
        </div>
      </div>
              ) : (
                <>
                  <div className="mb-6 mt-6">
                    <Input
                      type="text"
                      placeholder="Buscar por cliente"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="mt-4 flex gap-4">
                      <Input
                        type="date"
                        label="Fecha Inicio"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Input
                        type="date"
                        label="Fecha Fin"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
  
                  <div className="mb-1">
                    <Typography variant="h6" color="blue-gray" className="mb-4">
                      Lista de Ventas
                    </Typography>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              CLIENTE
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              FECHA DE VENTA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ESTADO
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ANULAR
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ACCIONES
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentVentas.map((venta) => (
                            <tr key={venta.id_venta}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {venta.cliente.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {venta.fecha_venta.split('T')[0]}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {venta.estado}
                              </td>
                            
                              
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">


                            <Button
  onClick={() => handleToggleActivo(venta.id_venta, false)}
  className={`${
    venta.activo ? 'bg-red-600 hover:bg-red-800' : 'bg-gray-400 cursor-not-allowed'
  } text-white rounded-sm px-1.5 py-0.5 transition h-7 w-16`}
  size="sm"
  disabled={!venta.activo} // Desactivar el botón si la venta ya está anulada
>
  Anular
</Button>

</td>

  
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                <IconButton 
                                  className="btnvisualizar" 
                                  size="sm" 
                                  onClick={() => handleViewDetails(venta)} 
                                  // Desactivar botón si la venta está desactivada
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </IconButton>
                                <IconButton 
                                  className="btnpdf" 
                                  size="sm" 
                                  onClick={() => generatePDF(venta)} 
                                  disabled={!venta.activo} // Desactivar botón si la venta está desactivada
                                >
                                  <ArrowDownIcon className="h-5 w-5" />
                                </IconButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <ul className="flex justify-center items-center space-x-2">
                        {pageNumbers.map((number) => (
                          <Button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`pagination ${number === currentPage ? 'active' : ''}`}
                            size="sm"
                          >
                            {number}
                          </Button>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <GenerarInformeVenta onCancel={handleCancelarInforme} />
          )}
        </CardBody>
      </Card>

       {/* Ejecutar la generación del reporte cuando el estado lo indique */}
       {mostrarReporteVentas && <ReporteVentas />}
  
      {/* Modal para capturar motivo de anulación */}
      {cancelOpen && (
        <Dialog open={true} handler={() => setCancelOpen(false)} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
          <DialogHeader className="bg-gray-100 text-gray-800 p-3 rounded-t-lg border-b border-gray-300">
            <Typography variant="h6" className="font-semibold">
              Motivo de Anulación
            </Typography>
          </DialogHeader>
          <DialogBody divider className="p-4 bg-white">
            <Input 
              label="Motivo de Anulación"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              className="w-full border-gray-300 rounded-md"
              required
            />
          </DialogBody>
          <DialogFooter className="bg-gray-100 p-3 flex justify-end gap-2 rounded-b-lg border-t border-gray-300">
            <Button variant="text" className="btncancelarm" size="sm" onClick={() => setCancelOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleCancelVenta}>
              Anular Venta
            </Button>
          </DialogFooter>
        </Dialog>
      )}
  

  
  <Dialog open={detailsOpen} handler={() => setDetailsOpen(false)} className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <DialogHeader className="text-lg font-semibold text-gray-800 border-b border-gray-300">
    Detalles de la Venta
  </DialogHeader>
  <DialogBody divider className="overflow-y-auto max-h-[60vh] p-4">
    {selectedVenta.cliente && (
      <div className="mb-6">
        <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
          Información del Cliente
        </Typography>
        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b">
              <td className="font-medium text-gray-700 py-2 px-4">ID Cliente:</td>
              <td className="py-2 px-4">{selectedVenta.cliente.id_cliente}</td>
            </tr>
            <tr className="border-b">
              <td className="font-medium text-gray-700 py-2 px-4">Nombre:</td>
              <td className="py-2 px-4">{selectedVenta.cliente.nombre}</td>
            </tr>
            <tr className="border-b">
              <td className="font-medium text-gray-700 py-2 px-4">Contacto:</td>
              <td className="py-2 px-4">{selectedVenta.cliente.contacto}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
    <div className="mb-6">
      <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
        Detalles de la Venta
      </Typography>
      <table className="w-full text-sm border-collapse">
        <tbody>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">ID Venta:</td>
            <td className="py-2 px-4">{selectedVenta.id_venta}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Número de Venta:</td>
            <td className="py-2 px-4">{selectedVenta.numero_venta}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Fecha de Venta:</td>
            <td className="py-2 px-4">{selectedVenta.fecha_venta.split('T')[0]}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Fecha de Entrega:</td>
            <td className="py-2 px-4">{selectedVenta.fecha_entrega}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Estado:</td>
            <td className="py-2 px-4">{selectedVenta.estado}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Pagado:</td>
            <td className="py-2 px-4">{selectedVenta.pagado ? "Sí" : "No"}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Total:</td>
            <td className="py-2 px-4">${selectedVenta.total.toFixed(2)}</td>
          </tr>
          <tr className="border-b">
            <td className="font-medium text-gray-700 py-2 px-4">Anulación:</td>
            <td className="py-2 px-4">{selectedVenta.anulacion || "N/A"}</td>
          </tr> {/* Añadimos esta fila */}
        </tbody>
      </table>
    </div>
    {/* Detalles de productos */}
    <div className="mb-6 overflow-x-auto">
      <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
        Detalles de Productos
      </Typography>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="font-medium text-gray-700 py-2 px-4">ID Detalle</th>
            <th className="font-medium text-gray-700 py-2 px-4">Producto</th>
            <th className="font-medium text-gray-700 py-2 px-4">Cantidad</th>
            <th className="font-medium text-gray-700 py-2 px-4">Precio Unitario</th>
          </tr>
        </thead>
        <tbody>
          {selectedVenta.detalleVentas.map((detalle) => (
            <tr key={detalle.id_detalle_venta} className="border-b">
              <td className="py-2 px-4">{detalle.id_detalle_venta}</td>
              <td className="py-2 px-4">{productos.find(p => p.id_producto === detalle.id_producto)?.nombre || 'Producto no encontrado'}</td>
              <td className="py-2 px-4">{detalle.cantidad}</td>
              <td className="py-2 px-4">${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </DialogBody>
  <DialogFooter className="p-4 border-t border-gray-300 flex justify-end">
    <Button variant="gradient" className="btncancelarm" size="sm" onClick={() => setDetailsOpen(false)}>
      Cerrar
    </Button>
  </DialogFooter>
</Dialog>

    </>
  );
   
}

export default Ventas;
