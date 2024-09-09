import React from "react";
import {
  Input,
  Select,
  Option,
  Button,
  Typography,
} from "@material-tailwind/react";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

const ClienteCrear = ({ selectedCliente, setSelectedCliente, fetchClientes, handleHideCreateForm }) => {
  const [formErrors, setFormErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedCliente({ ...selectedCliente, [name]: value });
  };

  const validateFields = (cliente) => {
    const errors = {};

    if (!cliente.nombre || cliente.nombre.length < 3) {
      errors.nombre = 'El nombre debe contener al menos 3 letras.';
    }

    if (!cliente.contacto || cliente.contacto.length < 7) {
      errors.contacto = 'El número de teléfono debe contener al menos 7 caracteres.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields(selectedCliente)) {
      return;
    }

    try {
      if (selectedCliente.id_cliente) {
        await axios.put(`http://localhost:3000/api/clientes/${selectedCliente.id_cliente}`, selectedCliente);
        Toast.fire({
          icon: 'success',
          title: '¡Actualizado! El cliente ha sido actualizado correctamente.'
        });
      } else {
        await axios.post("http://localhost:3000/api/clientes", selectedCliente);
        Toast.fire({
          icon: 'success',
          title: '¡Creado! El cliente ha sido creado correctamente.'
        });
      }
      fetchClientes();
      handleHideCreateForm(); // Oculta el formulario después de guardar
    } catch (error) {
      console.error("Error saving cliente:", error);
      Toast.fire({
        icon: 'error',
        title: 'Error al guardar cliente. Por favor, inténtalo de nuevo.'
      });
    }
  };

  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <Typography variant="h6" color="blue-gray" className="mb-4 text-center">
        {selectedCliente.id_cliente ? "Editar Cliente" : "Crear Cliente"}
      </Typography>
      
      <div className="space-y-4">
      <div>
          <Select
            label="Tipo Documento"
            name="tipo_documento"
            value={selectedCliente.tipo_documento}
            onChange={(e) => setSelectedCliente({ ...selectedCliente, tipo_documento: e })}
            className="w-full rounded-lg border-gray-300"
          >
           <Option value="Cédula">Cédula</Option>
              <Option value="NIT">NIT</Option>
              <Option value="Pasaporte">Pasaporte</Option>
              <Option value="Cédula Extranjería">Cédula Extranjería</Option>
          </Select>
        </div>
        <div>
          <Input
            label="Número Documento"
            name="numero_documento"
            value={selectedCliente.numero_documento}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300"
          />
        </div>
        <div>
          <Input
            label="Nombre del cliente"
            name="nombre"
            value={selectedCliente.nombre}
            onChange={handleChange}
            required
            error={formErrors.nombre}
            className="w-full rounded-lg border-gray-300"
          />
          {formErrors.nombre && <Typography className="text-red-500 mt-1 text-sm">{formErrors.nombre}</Typography>}
        </div>
        <div>
          <Input
            label="Número de teléfono"
            name="contacto"
            value={selectedCliente.contacto}
            onChange={handleChange}
            required
            error={formErrors.contacto}
            className="w-full rounded-lg border-gray-300"
          />
          {formErrors.contacto && <Typography className="text-red-500 mt-1 text-sm">{formErrors.contacto}</Typography>}
        </div>
        <div>
          <Input
            label="Email"
            name="email"
            value={selectedCliente.email}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300"
          />
        </div>
        
       
      </div>
      <div className="flex justify-end mt-6">
        <Button variant="text" className="btncancelarm" size="sm" color="red" onClick={handleHideCreateForm}>
          Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm ml-4" size="sm" onClick={handleSave}>
          {selectedCliente.id_cliente ? "Guardar Cambios" : "Crear Cliente"}
        </Button>
      </div>
    </div>
  );
};

export default ClienteCrear;
