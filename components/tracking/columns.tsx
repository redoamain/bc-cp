// "use client";

// import { ColumnDef } from "@tanstack/react-table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { ChevronDown, ChevronRight } from "lucide-react";
// import { useState } from "react";
// import { TrackingItem, ProduksiUsage, BarangJadi } from "@/lib/types";

// const ProduksiList = ({ produksiList }: { produksiList: ProduksiUsage[] }) => {
//   const [expanded, setExpanded] = useState(false);

//   if (!produksiList || produksiList.length === 0) {
//     return <span className="text-gray-400 text-sm">-</span>;
//   }

//   const totalKgs = produksiList.reduce(
//     (sum, p) => sum + (p.Jumlah_Bahan || 0),
//     0,
//   );

//   return (
//     <div>
//       <button
//         onClick={() => setExpanded(!expanded)}
//         className="text-xs text-blue-600 hover:underline"
//       >
//         {expanded ? "▼" : "▶"} {produksiList.length} produksi (
//         {totalKgs.toLocaleString()} )
//       </button>
//       {expanded && (
//         <div className="mt-2 space-y-2 max-h-60 overflow-auto">
//           {produksiList.map((prod, idx) => (
//             <div
//               key={idx}
//               className="text-xs border-l-2 border-blue-300 pl-2 py-1"
//             >
//               <div className="font-medium">
//                 ProdID: {prod.ProdID_Bahan || "-"}
//               </div>
//               <div className="text-gray-500">SPK: {prod.SPK || "-"}</div>
//               <div className="text-gray-700 font-medium">
//                 Jumlah: {(prod.Jumlah_Bahan || 0).toLocaleString()}
//               </div>
//               <div className="text-gray-400">PIC: {prod.PIC_Bahan || "-"}</div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const BarangJadiList = ({
//   barangJadiList,
// }: {
//   barangJadiList: BarangJadi[];
// }) => {
//   const [expanded, setExpanded] = useState(false);

//   if (!barangJadiList || barangJadiList.length === 0) {
//     return <span className="text-gray-400 text-sm">-</span>;
//   }

//   const totalJadi = barangJadiList.reduce(
//     (sum, b) => sum + (b.Jumlah_Kgs || 0),
//     0,
//   );

//   return (
//     <div>
//       <button
//         onClick={() => setExpanded(!expanded)}
//         className="text-xs text-green-600 hover:underline font-medium"
//       >
//         {expanded ? "▼" : "▶"} {barangJadiList.length} barang jadi (
//         {totalJadi.toLocaleString()} )
//       </button>
//       {expanded && (
//         <div className="mt-2 space-y-2 max-h-60 overflow-auto">
//           {barangJadiList.map((bj, idx) => (
//             <div
//               key={idx}
//               className="text-xs border-l-2 border-green-300 pl-2 py-1"
//             >
//               <div className="font-medium text-green-700">
//                 {bj.NamaBarang || bj.ItemID}
//               </div>
//               <div className="text-gray-500">SPK: {bj.SPK || "-"}</div>
//               <div className="text-gray-500">
//                 ProdID: {bj.ProdID_Hasil || "-"}
//               </div>
//               <div className="text-gray-700 font-medium">
//                 Jumlah: {(bj.Jumlah_Kgs || 0).toLocaleString()}
//               </div>
//               <div className="text-gray-400">PIC: {bj.PIC_Hasil || "-"}</div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export const columns: ColumnDef<TrackingItem>[] = [
//   {
//     accessorKey: "ItemID_Bahan",
//     header: "Kode Bahan",
//     size: 100,
//     cell: ({ row }) => (
//       <span className="font-mono text-xs">
//         {row.original.ItemID_Bahan || "-"}
//       </span>
//     ),
//   },
//   {
//     accessorKey: "NamaBahan",
//     header: "Nama Bahan",
//     size: 180,
//     cell: ({ row }) => row.original.NamaBahan || "-",
//   },
//   {
//     accessorKey: "Kategori",
//     header: "Kategori",
//     size: 130,
//     cell: ({ row }) => {
//       const kategori = row.original.Kategori || "-";
//       return (
//         <Badge variant="outline" className="bg-blue-50 text-blue-700">
//           {kategori}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "JenisDokumen",
//     header: "Jenis Dokumen",
//     size: 120,
//     cell: ({ row }) => row.original.JenisDokumen || "-",
//   },
//   {
//     accessorKey: "NomorBPB",
//     header: "No. BPB",
//     size: 120,
//     cell: ({ row }) => row.original.NomorBPB || "-",
//   },
//   {
//     accessorKey: "TanggalBPB",
//     header: "Tgl Masuk",
//     size: 100,
//     cell: ({ row }) => row.original.TanggalBPB || "-",
//   },
//   {
//     accessorKey: "Pemasok",
//     header: "Pemasok",
//     size: 150,
//     cell: ({ row }) => row.original.Pemasok || "-",
//   },
//   {
//     accessorKey: "JumlahMasuk_Kgs",
//     header: "Masuk ()",
//     size: 100,
//     cell: ({ row }) => (
//       <span className="font-medium text-blue-600">
//         {(row.original.JumlahMasuk_Kgs || 0).toLocaleString()}
//       </span>
//     ),
//   },
//   {
//     id: "stok_awal",
//     header: "Stok Awal",
//     size: 80,
//     cell: ({ row }) => {
//       const stokAwal = row.original.StokAwal || 0;
//       return (
//         <span className={stokAwal > 0 ? "text-blue-600" : "text-gray-400"}>
//           {stokAwal.toLocaleString()}
//         </span>
//       );
//     },
//   },
//   {
//     id: "pemakaian",
//     header: "Pemakaian",
//     size: 180,
//     cell: ({ row }) => {
//       const item = row.original;
//       const isOver = item.IsOverUsed || false;
//       const totalTerpakai = item.TotalKgsTerpakai || 0;
//       const totalTersedia = item.TotalStokTersedia || 0;
//       const persentase = item.PersentaseTerpakai || 0;
//       const safePersentase = Math.min(persentase, 100);

//       if (totalTerpakai === 0 && totalTersedia === 0) {
//         return (
//           <span className="text-gray-400 text-xs">Belum ada pemakaian</span>
//         );
//       }

//       return (
//         <div className="space-y-1">
//           <div className="flex justify-between text-xs">
//             <span className={isOver ? "text-red-600 font-bold" : ""}>
//               {totalTerpakai.toLocaleString()} /{" "}
//               {totalTersedia.toLocaleString()}
//             </span>
//             <span className={isOver ? "text-red-600 font-bold" : ""}>
//               {persentase}%
//             </span>
//           </div>
//           <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
//             <div
//               className={`absolute top-0 left-0 h-full rounded-full transition-all ${
//                 isOver ? "bg-red-500" : "bg-blue-500"
//               }`}
//               style={{ width: `${safePersentase}%` }}
//             />
//           </div>
//         </div>
//       );
//     },
//   },
//   {
//     id: "produksi_detail",
//     header: "Detail Produksi",
//     size: 150,
//     cell: ({ row }) => (
//       <ProduksiList produksiList={row.original.DigunakanDiProduksi || []} />
//     ),
//   },
//   {
//     id: "menghasilkan",
//     header: "Barang Jadi",
//     size: 220,
//     cell: ({ row }) => (
//       <BarangJadiList
//         barangJadiList={row.original.MenghasilkanBarangJadi || []}
//       />
//     ),
//   },
//   {
//     id: "total_jadi",
//     header: "Total Jadi",
//     size: 80,
//     cell: ({ row }) => (
//       <span className="font-medium text-green-600">
//         {(row.original.TotalBarangJadi || 0).toLocaleString()}
//       </span>
//     ),
//   },
// ];
