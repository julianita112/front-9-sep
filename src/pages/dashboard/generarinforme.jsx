import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardBody, Button, Input, Typography } from "@material-tailwind/react";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx'; // Importa la librería XLSX

Chart.register(...registerables);

export function GenerarInforme({ onCancel }) { // onCancel para manejar el botón de cancelar
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaGeneracion, setFechaGeneracion] = useState(""); // Fecha de generación del informe
  const [insumosMasComprados, setInsumosMasComprados] = useState([]);
  const [proveedoresMasComprados, setProveedoresMasComprados] = useState([]);
  const [numeroCompras, setNumeroCompras] = useState(0); // Número de compras en el periodo
  const [insumos, setInsumos] = useState([]); // Lista de insumos
  const [informeGenerado, setInformeGenerado] = useState(false); // Para controlar si se ha generado el informe

  useEffect(() => {
    fetchInsumos(); // Obtener los insumos al cargar el componente
  }, []);

  const fetchInsumos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/insumos');
      setInsumos(response.data);
    } catch (error) {
      console.error("Error fetching insumos:", error);
    }
  };

  const handleGenerarInforme = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/compras'); // Obtener todas las compras
      const compras = response.data;

      // Filtrar por rango de fechas
      const comprasFiltradas = compras.filter((compra) => {
        const fechaCompra = new Date(compra.fecha_compra);
        return fechaCompra >= new Date(fechaInicio) && fechaCompra <= new Date(fechaFin);
      });

      // Establecer el número de compras realizadas en el periodo
      setNumeroCompras(comprasFiltradas.length);

      // Mapear insumos y contar cantidades compradas
      const insumosCantidad = {};
      const proveedoresCantidad = {};

      comprasFiltradas.forEach((compra) => {
        compra.detalleComprasCompra.forEach((detalle) => {
          if (!insumosCantidad[detalle.id_insumo]) {
            const insumo = insumos.find(ins => ins.id_insumo === detalle.id_insumo);
            insumosCantidad[detalle.id_insumo] = {
              id_insumo: detalle.id_insumo,
              cantidad: 0,
              nombre: insumo ? insumo.nombre : 'Desconocido', // Obtener el nombre del insumo o marcarlo como desconocido
            };
          }
          insumosCantidad[detalle.id_insumo].cantidad += detalle.cantidad;
        });

        if (!proveedoresCantidad[compra.id_proveedor]) {
          proveedoresCantidad[compra.id_proveedor] = {
            id_proveedor: compra.id_proveedor,
            nombre: compra.proveedorCompra?.nombre || "Desconocido",
            totalComprado: 0,
          };
        }
        proveedoresCantidad[compra.id_proveedor].totalComprado += parseFloat(compra.total);
      });

      // Ordenar insumos y proveedores por cantidades y total
      const insumosMasComprados = Object.values(insumosCantidad).sort((a, b) => b.cantidad - a.cantidad);
      const proveedoresMasComprados = Object.values(proveedoresCantidad).sort((a, b) => b.totalComprado - a.totalComprado);

      setInsumosMasComprados(insumosMasComprados);
      setProveedoresMasComprados(proveedoresMasComprados);

      // Establecer la fecha de generación del informe como la fecha actual
      const fechaActual = new Date().toLocaleDateString();
      setFechaGeneracion(fechaActual);

      setInformeGenerado(true); // Marcar que el informe ha sido generado

      Swal.fire({
        icon: 'success',
        title: 'Informe generado con éxito',
        showConfirmButton: false,
        timer: 2000,
      });

    } catch (error) {
      console.error("Error generando informe:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error generando informe',
        text: error.message,
      });
    }
  };

  const handleDescargarExcel = () => {
    // Crea los datos para el archivo Excel
    const datosExcel = [
      { encabezado: "Informe de Compras", valor: "" },
      { encabezado: "Fecha de Generación", valor: fechaGeneracion },
      { encabezado: "Periodo", valor: `${fechaInicio} - ${fechaFin}` },
      { encabezado: "Número de Compras Realizadas", valor: numeroCompras },
      {},
      { encabezado: "Insumos más comprados", valor: "" },
      ...insumosMasComprados.map(insumo => ({
        encabezado: insumo.nombre,
        valor: insumo.cantidad,
      })),
      {},
      { encabezado: "Proveedores con más compras", valor: "" },
      ...proveedoresMasComprados.map(proveedor => ({
        encabezado: proveedor.nombre,
        valor: `$${proveedor.totalComprado.toFixed(2)}`,
      })),
    ];

    // Crea una hoja de trabajo (worksheet)
    const ws = XLSX.utils.json_to_sheet(datosExcel, { header: ["encabezado", "valor"] });

    // Crea un libro de trabajo (workbook)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe de Compras");

    // Genera y descarga el archivo Excel
    XLSX.writeFile(wb, `informe_compras_${fechaGeneracion}.xlsx`);
  };

  // Datos para las gráficas
  const insumosLabels = insumosMasComprados.map(insumo => insumo.nombre);
  const insumosData = insumosMasComprados.map(insumo => insumo.cantidad);

  const proveedoresLabels = proveedoresMasComprados.map(proveedor => proveedor.nombre);
  const proveedoresData = proveedoresMasComprados.map(proveedor => proveedor.totalComprado);

  const insumosChartData = {
    labels: insumosLabels,
    datasets: [
      {
        label: 'Cantidad Comprada',
        data: insumosData,
        backgroundColor: [
          '#AE017E', // Fucsia
          '#7A0177', // Morado
          '#49006A', // Negro
          // Puedes agregar más colores similares si es necesario
        ],
      },
    ],
  };

  const proveedoresChartData = {
    labels: proveedoresLabels,
    datasets: [
      {
        label: 'Total Comprado',
        data: proveedoresData,
        backgroundColor: [
          '#AE017E', // Magenta Oscuro
          '#7A0177', // Morado Intenso
          '#49006A', // Púrpura Oscuro
          // Puedes añadir más colores similares si es necesario
        ],
        borderColor: [
          '#AE017E', // Magenta Oscuro
          '#7A0177', // Morado Intenso
          '#49006A', // Púrpura Oscuro
          // Puedes añadir más colores similares si es necesario
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    aspectRatio: 1.5,
    scales: {
      y: {
        beginAtZero: true,
        max: 15000,
        ticks: {
          stepSize: 400,
        },
      },
    },
  };

  return (
    <Card className="mt-6 flex flex-col relative">
      <CardBody className="flex flex-col flex-grow">
        <Typography variant="h6" className="mb-6">Generar Informe de Compras</Typography>
        <div className="flex flex-col gap-4 mb-6">
          <Input
            type="date"
            label="Fecha Inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input
            type="date"
            label="Fecha Fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <div className="flex gap-4 mb-6">
          <Button onClick={handleGenerarInforme} color="blue">Generar Informe</Button>
          <Button onClick={onCancel} color="red">Cancelar</Button> {/* Botón de cancelar */}
        </div>

        {fechaGeneracion && (
          <>
            <Typography variant="h6" className="mt-6">Fecha de generación del informe: {fechaGeneracion}</Typography>
            <Typography variant="h6" className="mt-6">Periodo del informe: {fechaInicio} - {fechaFin}</Typography>
            <Typography variant="h6" className="mt-6">Número de compras realizadas en el periodo: {numeroCompras}</Typography>
          </>
        )}

        {insumosMasComprados.length > 0 && (
          <>
            <Typography variant="h6" className="mt-6">Insumos más comprados:</Typography>
            <div style={{ height: '300px' }}> {/* Ajusta la altura */}
              <Bar data={insumosChartData} options={chartOptions} />
            </div>
          </>
        )}

        {proveedoresMasComprados.length > 0 && (
          <>
            <Typography variant="h6" className="mt-6">Proveedores con más compras:</Typography>
            <div style={{ height: '300px' }}> {/* Ajusta la altura */}
              <Doughnut data={proveedoresChartData} options={chartOptions} />
            </div>
          </>
        )}
      
      {informeGenerado && (
 <div className="flex justify-end mt-6">
 <Button className="px-4 py-2" onClick={handleDescargarExcel}>
   Descargar Reporte
 </Button>
</div>

)}
 </CardBody>
    </Card>
  );
}
