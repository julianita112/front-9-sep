import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Select,
  Option,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { PlusIcon, EyeIcon, PencilIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';
import { CrearPedido } from './CrearPedido';
import { EditarPedido } from './EditarPedido';

export function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [showForm, setShowForm] = useState("lista"); // Controlar la vista
  const [selectedPedido, setSelectedPedido] = useState({});
  const [selectedEstado, setSelectedEstado] = useState("");
  const [pedidoToCancel, setPedidoToCancel] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pedidosPerPage] = useState(5);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPedidos();
    fetchClientes();
    fetchProductos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pedidos");
      setPedidos(response.data);
      setFilteredPedidos(response.data);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
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
      const response = await axios.get("http://localhost:3000/api/productos/activos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  useEffect(() => {
    filterPedidos();
  }, [search, pedidos]);

  const filterPedidos = () => {
    const searchTerm = typeof search === 'string' ? search.toLowerCase() : '';
    const filtered = pedidos.filter((pedido) =>
      pedido.clientesh.nombre.toLowerCase().includes(searchTerm) ||
      pedido.clientesh.numero_documento.toLowerCase().includes(searchTerm) // Permitir búsqueda por número de documento
    );
    setFilteredPedidos(filtered);
  };

  const handleCreate = () => {
    setShowForm("crear"); // Cambiar a vista de crear pedido
  };

  const handleEdit = (pedido) => {
    setSelectedPedido(pedido);
    setShowForm("editar"); // Cambiar a vista de editar pedido
  };

  const handleDetailsOpen = (pedido) => {
    setSelectedPedido(pedido);
    setShowForm("detalles"); // Cambiar a vista de detalles
  };

  const handleDetailsClose = () => {
    setShowForm("lista"); // Regresar a la lista de pedidos
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleEstadoOpen = (pedido) => {
    setSelectedPedido(pedido);
    setSelectedEstado(pedido.estado);
    setShowForm("estado"); // Cambiar a vista de actualizar estado
  };

  const handleEstadoClose = () => setShowForm("lista");

  const handleUpdateEstado = async () => {
    try {
      const response = await axios.put(`http://localhost:3000/api/pedidos/${selectedPedido.numero_pedido}/estado`, { estado: selectedEstado });
      const updatedPedido = response.data;

      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.numero_pedido === updatedPedido.numero_pedido ? { ...pedido, estado: updatedPedido.estado } : pedido
        )
      );

      Swal.fire({
        title: '¡Actualización exitosa!',
        text: 'El estado del pedido ha sido actualizado correctamente.',
        icon: 'success',
      });
      handleEstadoClose();
    } catch (error) {
      console.error("Error updating estado del pedido:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar el estado del pedido.',
        icon: 'error',
      });
    }
  };

  const toggleActivo = async (id_pedido, activo) => {
    const pedido = pedidos.find(p => p.id_pedido === id_pedido);
    if (!pedido) {
      Swal.fire({
        icon: 'error',
        title: 'Pedido no encontrado.',
      });
      return;
    }

    if (!activo && pedido.anulacion) { // Verifica si el pedido ya ha sido anulado
      Swal.fire({
        icon: 'error',
        title: 'No se puede reactivar un pedido anulado.',
      });
      return;
    }

    if (!activo) { // Si se está intentando activar el pedido
      try {
        await axios.patch(`http://localhost:3000/api/pedidos/${id_pedido}/estado`, { activo: true });
        fetchPedidos();
        Swal.fire({
          icon: 'success',
          title: 'El pedido ha sido activado correctamente.',
        });
      } catch (error) {
        console.error("Error al cambiar el estado del pedido:", error.response?.data || error.message);
        Swal.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del pedido.',
        });
      }
    } else {
      // Si se está intentando desactivar, abrimos el modal de anulación
      setPedidoToCancel(id_pedido);
      setShowForm("anular"); // Cambiar a vista de anular pedido
    }
  };

  const handleCancelPedido = async () => {
    if (!motivoAnulacion.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Debe proporcionar un motivo de anulación.',
      });
      return;
    }

    try {
      await axios.patch(`http://localhost:3000/api/pedidos/${pedidoToCancel}/estado`, {
        activo: false,
        anulacion: motivoAnulacion
      });
      fetchPedidos();
      Swal.fire({
        icon: 'success',
        title: 'El pedido ha sido anulado correctamente.',
      });
      setShowForm("lista"); // Volver a la vista de lista
      setMotivoAnulacion('');
    } catch (error) {
      console.error("Error al anular el pedido:", error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: `Hubo un problema al anular el pedido: ${error.response?.data?.error || error.message}`,
      });
    }
  };

  const handleCancelCreateEdit = () => {
    setShowForm("lista"); // Volver a la lista
  };

  const indexOfLastPedido = currentPage * pedidosPerPage;
  const indexOfFirstPedido = indexOfLastPedido - pedidosPerPage;
  const currentPedidos = filteredPedidos.slice(indexOfFirstPedido, indexOfLastPedido);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredPedidos.length / pedidosPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-2 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          {showForm === "lista" && ( // Mostrar la lista de pedidos
            <>
              <div className="flex items-center justify-between mb-6">
              <Button onClick={handleCreate} className="btnagregar" size="sm" startIcon={<PlusIcon />}>
                Crear Pedido
              </Button>
              <input
                type="text"
                placeholder="Buscar por Cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-4 border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm" // Ajusta el padding vertical y horizontal
                style={{ width: '265px' }} // Ajusta el ancho del campo de búsqueda
              />
              </div>

              <div className="mb-1">
                <Typography variant="h6" color="blue-gray" className="mb-4">
                  Lista de Pedidos
                </Typography>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número Documento</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Entrega</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anular</th>
                        <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actualizar    Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPedidos.map((pedido) => (
                        <tr key={pedido.id_pedido}>
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{pedido.clientesh.nombre}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{pedido.clientesh.numero_documento}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">{pedido.fecha_entrega.split('T')[0]}</td>
                          <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">{pedido.estado}</td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <button
  onClick={() => toggleActivo(pedido.id_pedido, pedido.activo)}
  className={`${
    pedido.activo ? 'bg-red-600 hover:bg-red-800' : 'bg-gray-400 cursor-not-allowed'
  } text-white rounded-sm px-1.5 py-0.5 transition h-7 w-16`}
  size="sm"
  disabled={!pedido.activo} // Desactivar el botón si el pedido ya está anulado
>
  Anular
</button>



                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-1">
                              <IconButton
                                className="btnedit"
                                size="sm"
                                color="blue"
                                onClick={() => handleEdit(pedido)}
                                disabled={!pedido.activo || pedido.estado === "Completado"}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                className="btnvisualizar"
                                size="sm"
                                onClick={() => handleDetailsOpen(pedido)} // Mostrar detalles al hacer clic
                                
                              >
                                <EyeIcon className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <IconButton
                              className="btnupdate"
                              size="sm"
                              color="blue-gray"
                              onClick={() => handleEstadoOpen(pedido)}
                              disabled={!pedido.activo || pedido.estado === "Completado"}
                            >
                              <PencilIcon className="h-4 w-4" />
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

          {showForm === "crear" && ( // Mostrar el formulario de creación de pedido
            <CrearPedido 
              clientes={clientes} 
              productos={productos} 
              fetchPedidos={fetchPedidos} 
              onCancel={handleCancelCreateEdit} // Para volver a la lista de pedidos
            />
          )}

          {showForm === "editar" && ( // Mostrar el formulario de edición de pedido
            <EditarPedido 
              pedido={selectedPedido}
              clientes={clientes} 
              productos={productos} 
              fetchPedidos={fetchPedidos} 
              onCancel={handleCancelCreateEdit} // Para volver a la lista de pedidos
            />
          )}

          {showForm === "detalles" && ( // Mostrar los detalles del pedido seleccionado
            <DetallesPedido 
              pedido={selectedPedido} 
              productos={productos}
              onClose={handleDetailsClose} // Para cerrar la vista de detalles
            />
          )}

{showForm === "estado" && ( // Mostrar diálogo para cambiar estado
  <Dialog open={true} handler={handleEstadoClose} className="custom-modal">
    <DialogHeader className="text-black p-2 text-lg">Actualizar Estado del Pedido</DialogHeader>
    <DialogBody divider className="p-10 flex flex-col gap-8">
      <Select
        label="Estado"
        name="estado"
        value={selectedEstado}
        onChange={(e) => setSelectedEstado(e)}
        className="w-full"
        required
        disabled={selectedPedido.estado === "Completado"}
      >
        {selectedPedido.pagado ? (
          <>
            {selectedPedido.estado === "Pendiente de Preparación" && (
              <Option value="En Preparación">En Preparación</Option>
            )}
            {selectedPedido.estado === "En Preparación" && (
              <Option value="Listo Para Entrega">Listo Para Entrega</Option>
            )}
            {selectedPedido.estado === "Listo Para Entrega" && (
              <Option value="Completado">Completado</Option>
            )}
            {selectedPedido.estado === "Esperando Pago" && (
              <Option value="Pendiente de Preparación">Pendiente de Preparación</Option>
            )}
          </>
        ) : (
          <Option value="Esperando Pago">Esperando Pago</Option>
        )}
      </Select>
    </DialogBody>
    <DialogFooter className="bg-white p-2 flex justify-end gap-2">
      <Button variant="text" className="btncancelarm" size="sm" onClick={handleEstadoClose}>
        Cancelar
      </Button>
      <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleUpdateEstado}>
        Actualizar Estado
      </Button>
    </DialogFooter>
  </Dialog>
)}


          {showForm === "anular" && ( // Mostrar diálogo para anular pedido
            <Dialog open={true} handler={() => setShowForm("lista")} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
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
                <Button variant="text" className="btncancelarm" size="sm" onClick={() => setShowForm("lista")}>
                  Cancelar
                </Button>
                <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleCancelPedido}>
                  Anular Pedido
                </Button>
              </DialogFooter>
            </Dialog>
          )}
        </CardBody>
      </Card>
    </>
  );
}

const DetallesPedido = ({ pedido, productos, onClose }) => (
  <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
    <Typography className="text-black p-2 text-lg mb-4">Detalles del Pedido</Typography>
    
    {/* Información del Cliente */}
    {pedido.clientesh && (
      <div className="mb-6">
        <Typography className="text-black p-2 text-lg mb-2">Información del Cliente</Typography>
        <table className="min-w-full">
          <tbody>
            <tr>
              <td className="font-semibold">ID Cliente:</td>
              <td>{pedido.clientesh.id_cliente}</td>
            </tr>
            <tr>
              <td className="font-semibold">Nombre:</td>
              <td>{pedido.clientesh.nombre}</td>
            </tr>
            <tr>
              <td className="font-semibold">Número de Documento:</td>
              <td>{pedido.clientesh.numero_documento}</td>
            </tr>
            <tr>
              <td className="font-semibold">Contacto:</td>
              <td>{pedido.clientesh.contacto}</td>
            </tr>
            <tr>
              <td className="font-semibold">Creado:</td>
              <td>{new Date(pedido.clientesh.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="font-semibold">Actualizado:</td>
              <td>{new Date(pedido.clientesh.updatedAt).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {/* Información del Pedido */}
<div className="mb-6">
  <Typography className="text-black p-2 text-lg mb-2">Información del Pedido</Typography>
  <table className="min-w-full">
    <tbody>
      <tr>
        <td className="font-semibold">ID Pedido:</td>
        <td>{pedido.id_pedido}</td>
      </tr>
      <tr>
        <td className="font-semibold">Número de Pedido:</td>
        <td>{pedido.numero_pedido}</td>
      </tr>
      <tr>
        <td className="font-semibold">Fecha de Entrega:</td>
        <td>{pedido.fecha_entrega ? pedido.fecha_entrega.split('T')[0] : "N/A"}</td>
      </tr>
      <tr>
        <td className="font-semibold">Fecha de Registro:</td>
        <td>{pedido.fecha_registro ? pedido.fecha_registro.split('T')[0] : "N/A"}</td>
      </tr>
      <tr>
        <td className="font-semibold">Fecha de Pago:</td>
        <td>{pedido.fecha_pago ? pedido.fecha_pago.split('T')[0] : "N/A"}</td>
      </tr>
      <tr>
        <td className="font-semibold">Estado:</td>
        <td>{pedido.estado}</td>
      </tr>
      <tr>
        <td className="font-semibold">Pagado:</td>
        <td>{pedido.pagado ? "Sí" : "No"}</td>
      </tr>
      {/* Nueva fila para el total del pedido */}
      <tr>
        <td className="font-semibold">Total:</td>
        <td>${pedido.total ? pedido.total : "N/A"}</td>
      </tr>
      {/* Nueva fila para la anulación */}
      <tr>
        <td className="font-semibold">Anulación:</td>
        <td>{pedido.anulacion ? pedido.anulacion : "N/A"}</td>
      </tr>
    </tbody>
  </table>
</div>


    {/* Detalles de Productos */}
    <div className="mb-6">
      <Typography className="text-black p-2 text-lg mb-2">Detalles de Productos</Typography>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="font-semibold">Producto</th>
            <th className="font-semibold">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {pedido.detallesPedido.map((detalle, index) => {
            const producto = productos.find(p => p.id_producto === detalle.id_producto);
            return (
              <tr key={index}>
                <td>{producto ? producto.nombre : 'Producto no encontrado'}</td>
                <td>{detalle.cantidad}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* Botón para Cerrar */}
    <div className="mt-4 flex justify-end">
      <Button variant="gradient" color="blue-gray" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  </div>
);

