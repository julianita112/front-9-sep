import React, { useState } from "react";
import {
  Button,
  Input,
  IconButton,
  Select,
  Option,
  Typography,
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import axios from "../../utils/axiosConfig";

export function CrearCompra({ handleClose, fetchCompras, proveedores, insumos }) {
  const [selectedCompra, setSelectedCompra] = useState({
    id_proveedor: "",
    fecha_compra: "",
    fecha_registro: "",
    numero_recibo: "",
    estado: "Completado",
    detalleCompras: [],
    total: 0,
    subtotal: 0,
  });
  const [errors, setErrors] = useState({});

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const validateForm = () => {
    const newErrors = {};
    if (!selectedCompra.id_proveedor) {
      newErrors.id_proveedor = "El proveedor es obligatorio";
    }
    if (!selectedCompra.fecha_compra) {
      newErrors.fecha_compra = "La fecha de compra es obligatoria";
    }
    if (!selectedCompra.fecha_registro) {
      newErrors.fecha_registro = "La fecha de registro es obligatoria";
    }
    if (!selectedCompra.numero_recibo) {
      newErrors.numero_recibo = "El número de recibo es obligatorio";
    }
    if (selectedCompra.detalleCompras.length === 0) {
      newErrors.detalleCompras = "Debe agregar al menos un detalle de compra";
    }
    selectedCompra.detalleCompras.forEach((detalle, index) => {
      if (!detalle.id_insumo) {
        newErrors[`insumo_${index}`] = "El insumo es obligatorio";
      }
      if (!detalle.cantidad || detalle.cantidad <= 0) {
        newErrors[`cantidad_${index}`] = "La cantidad debe ser mayor a 0";
      }
      if (!detalle.precio_unitario || detalle.precio_unitario <= 0) {
        newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser mayor a 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      // Muestra un toast si hay errores en el formulario
      Toast.fire({
        icon: 'error',
        title: 'Por favor, completa los datos correctamente.'
      });
      return;
    }
  

    const insumosSeleccionados = selectedCompra.detalleCompras.map(
      (detalle) => detalle.id_insumo
    );
    const insumosUnicos = new Set(insumosSeleccionados);
    if (insumosSeleccionados.length !== insumosUnicos.size) {
      Toast.fire({
        icon: "error",
        title: "No se pueden seleccionar insumos duplicados.",
      });
      return;
    }

    const compraToSave = {
      id_proveedor: parseInt(selectedCompra.id_proveedor),
      fecha_compra: selectedCompra.fecha_compra,
      fecha_registro: selectedCompra.fecha_registro,
      numero_recibo: selectedCompra.numero_recibo,
      estado: selectedCompra.estado,
      total: selectedCompra.total,
      detalleCompras: selectedCompra.detalleCompras.map((detalle) => ({
        id_insumo: parseInt(detalle.id_insumo),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
      })),
    };

    try {
      await axios.post("http://localhost:3000/api/compras", compraToSave);
      Toast.fire({
        icon: "success",
        title: "La compra ha sido creada correctamente.",
      });
      fetchCompras();
      handleClose();
    } catch (error) {
      console.error("Error saving compra:", error);
      Toast.fire({
        icon: "error",
        title: "Hubo un problema al guardar la compra.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedCompra({ ...selectedCompra, [name]: value });
    validateField(name, value);
  };
  

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedCompra.detalleCompras];

    if (name === "cantidad") {
      detalles[index][name] = value.replace(/\D/, "");
    } else if (name === "precio_unitario") {
      detalles[index][name] = value.replace(/[^\d.]/, "");
    } else {
      detalles[index][name] = value;
    }

    const cantidad = parseFloat(detalles[index].cantidad) || 0;
    const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
    detalles[index].subtotal = cantidad * precioUnitario;

    setSelectedCompra({ ...selectedCompra, detalleCompras: detalles });
    setErrors({ ...errors, [`${name}_${index}`]: "" });
    updateTotal(detalles);
  };

  const validateField = (name, value, index = null) => {
    const newErrors = { ...errors };
  
    switch (name) {
      case "id_proveedor":
        if (!value) {
          newErrors.id_proveedor = "El proveedor es obligatorio";
        } else {
          delete newErrors.id_proveedor;
        }
        break;
      case "fecha_compra":
        if (!value) {
          newErrors.fecha_compra = "La fecha de compra es obligatoria";
        } else {
          delete newErrors.fecha_compra;
        }
        break;
      case "fecha_registro":
        if (!value) {
          newErrors.fecha_registro = "La fecha de registro es obligatoria";
        } else {
          delete newErrors.fecha_registro;
        }
        break;
      case "numero_recibo":
        if (!value) {
          newErrors.numero_recibo = "El número de recibo es obligatorio";
        } else if (value.length < 4 || value.length > 15) {
          newErrors.numero_recibo = "El número de recibo debe tener entre 4 y 15 caracteres";
        } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
          newErrors.numero_recibo = "El número de recibo solo puede contener letras y números";
        } else {
          delete newErrors.numero_recibo;
        }
        break;
      case "cantidad":
        if (!value) {
          newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
        } else if (!/^\d+$/.test(value)) {
          newErrors[`cantidad_${index}`] = "La cantidad solo puede contener dígitos";
        } else if (parseInt(value, 10) <= 0) {
          newErrors[`cantidad_${index}`] = "La cantidad debe ser mayor a 0";
        } else {
          delete newErrors[`cantidad_${index}`];
        }
        break;
      case "precio_unitario":
        if (!value) {
          newErrors[`precio_unitario_${index}`] = "El precio unitario es obligatorio";
        } else if (!/^\d*\.?\d*$/.test(value)) {
          newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser un número válido";
        } else if (parseFloat(value) <= 0) {
          newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser mayor a 0";
        } else {
          delete newErrors[`precio_unitario_${index}`];
        }
        break;
      default:
        break;
    }
  
    setErrors(newErrors);
  };
  

  const handleAddDetalle = () => {
    setSelectedCompra({
      ...selectedCompra,
      detalleCompras: [
        ...selectedCompra.detalleCompras,
        { id_insumo: "", cantidad: "", precio_unitario: "", subtotal: 0 },
      ],
    });
  };

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedCompra.detalleCompras];
    detalles.splice(index, 1);
    setSelectedCompra({ ...selectedCompra, detalleCompras: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
    setSelectedCompra((prevState) => ({
      ...prevState,
      total,
      subtotal: total,
    }));
  };

  return (


    
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex gap-4 mb-4">
      <div className="flex flex-col gap-4 w-1/2 pr-4 bg-white rounded-lg shadow-sm p-4">
          <div>
            <Select
              label="Proveedor"
              name="id_proveedor"
              value={selectedCompra.id_proveedor}
              onChange={(e) => {
                setSelectedCompra({ ...selectedCompra, id_proveedor: e });
                setErrors({ ...errors, id_proveedor: "" });
              }}
              className={`w-full ${errors.id_proveedor ? "border-red-500" : ""}`}
              required
            >
              {proveedores
                .filter((proveedor) => proveedor.activo)
                .map((proveedor) => (
                  <Option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                    {proveedor.nombre}
                  </Option>
                ))}
            </Select>
            {errors.id_proveedor && <p className="text-red-500 text-xs mt-1">{errors.id_proveedor}</p>}
          </div>
          <div>
            <Input
              label="Fecha de Compra"
              name="fecha_compra"
              type="date"
              value={selectedCompra.fecha_compra}
              onChange={handleChange}
              className={`w-full ${errors.fecha_compra ? "border-red-500" : ""}`}
              required
            />
            {errors.fecha_compra && <p className="text-red-500 text-xs mt-1">{errors.fecha_compra}</p>}
          </div>
          <div>
            <Input
              label="Fecha de Registro"
              name="fecha_registro"
              type="date"
              value={selectedCompra.fecha_registro}
              onChange={handleChange}
              className={`w-full ${errors.fecha_registro ? "border-red-500" : ""}`}
              required
            />
            {errors.fecha_registro && <p className="text-red-500 text-xs mt-1">{errors.fecha_registro}</p>}
          </div>
          <div>
            <Input
              label="Número de Recibo"
              name="numero_recibo"
              type="text"
              value={selectedCompra.numero_recibo}
              onChange={handleChange}
              className={`w-full ${errors.numero_recibo ? "border-red-500" : ""}`}
              required
            />
            {errors.numero_recibo && <p className="text-red-500 text-xs mt-1">{errors.numero_recibo}</p>}
          </div>
        </div>

        <div className="w-1/2">
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Insumos a comprar
          </Typography>

          <div className="bg-gray-100 p-4 rounded-lg shadow-lg flex-2 overflow-y-auto max-h-[800px]">
            {selectedCompra.detalleCompras.map((detalle, index) => (
              <div key={index} className="mb-4 flex items-center">
                <div className="flex-1 flex flex-col gap-4 mb-2">
                  <div>
                    <Select
                      label="Insumo"
                      name="id_insumo"
                      value={detalle.id_insumo}
                      onChange={(e) => {
                        handleDetalleChange(index, { target: { name: "id_insumo", value: e } });
                        setErrors({ ...errors, [`insumo_${index}`]: "" });
                      }}
                      className="w-full text-xs"
                    >
                      {insumos
                        .filter((insumo) => insumo.activo)
                        .map((insumo) => (
                          <Option key={insumo.id_insumo} value={insumo.id_insumo}>
                            {insumo.nombre}
                          </Option>
                        ))}
                    </Select>
                    {errors[`insumo_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`insumo_${index}`]}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Cantidad"
                      name="cantidad"
                      type="number"
                      required
                      value={detalle.cantidad}
                      onChange={(e) => {
                        handleDetalleChange(index, e);
                        setErrors({ ...errors, [`cantidad_${index}`]: "" });
                      }}
                      className="w-full text-xs"
                    />
                    {errors[`cantidad_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Precio Unitario"
                      name="precio_unitario"
                      type="number"
                      step="0.01"
                      required
                      value={detalle.precio_unitario}
                      onChange={(e) => {
                        handleDetalleChange(index, e);
                        setErrors({ ...errors, [`precio_unitario_${index}`]: "" });
                      }}
                      className="w-full text-xs"
                    />
                    {errors[`precio_unitario_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`precio_unitario_${index}`]}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Subtotal"
                      name="subtotal"
                      type="text"
                      value={`$${(detalle.subtotal || 0).toFixed(2)}`}
                      readOnly
                      className="w-full text-xs bg-gray-100"
                    />
                  </div>
                </div>
                <div className="flex items-center ml-2">
                  <IconButton
                    color="red"
                    onClick={() => handleRemoveDetalle(index)}
                    className="btncancelarm"
                    size="sm"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}


            <div className="mt-2">
              <Button
              size="sm"
              onClick={handleAddDetalle}
              className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-2 py-1 rounded-md"
              style={{ width: 'auto' }}
              >
                <PlusIcon className="h-5 w-5" />
                <span className="sr-only">Agregar Detalle</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-4">
        <Typography variant="h6" color="blue-gray">
          Total de la Compra: ${(selectedCompra.total || 0).toFixed(2)}
        </Typography>
      </div>
      

      <div className="mt-4 flex justify-end gap-4">
        <Button variant="text" className="btncancelarm" size="sm" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
          Crear Compra
        </Button>
      </div>
    </div>
  );
}
