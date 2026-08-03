// lib/types.ts
export interface PemasukanType {
  JenisDokPabean: string;
  NomorDokPabean: string;
  TanggalDokPabean: Date | string;
  NomorBPB: number;
  TanggalBPB: Date | string;
  PemasokPengirim: string;
  kodebarang: string;
  Namabarang: string;
  Jumlah: number;
  Satuan: string;
  CURR: string;
  NilaiBarang: number;
  Nopol: string;
  NoInvoice: string;
}
export interface PengeluaranType {
  JenisDokPabean: string;
  NomorDokPabean: string;
  TanggalDokPabean: Date | string;
  NomorSuratJalan: number;
  TanggalSuratJalan: Date | string;
  PembeliPeneima: string;
  KodeBarang: string;
  NamaBarang: string;
  Jumlah: number;
  Satuan: string;
  Curr: string;
  NilaiBarang: number;
  Nopol: string;
}

export interface ReturPembelianType {
  JenisDokPabean: string;
  NomorDokPabean: string;
  TanggalDokPabean: Date | string;
  NomorSuratJalan: number;
  TanggalSuratJalan: Date | string;
  PembeliPeneima: string;
  KodeBarang: string;
  NamaBarang: string;
  Jumlah: number;
  Satuan: string;
  Curr: string;
  NilaiBarang: number;
  Nopol: string;
}

export interface LogType {
  Remark: string;
  Username: string;
  UserDateTime: Date | string;
  kgs: number;
  TransNo: number;
  ItemID: string;
  IpAddr: string;
  TransDateTime: Date | string;
}

export interface MutasiType {
  KodeBarang: string;
  NamaBarang: string;
  Satuan: string;
  saldoawal: number;
  Pemasukan: number;
  Pengeluaran: number;
  Penyesuaian: number;
  SaldoAkhir: number;
  stokopname: number;
  selisih: number;
  Keterangan: string;
  Pencacahan: number;
  Penggunaan: number;
  Retur: number;
}
export type ProduksiType = {
  type: string;
  ProdID: string;
  ProdType: string;
  ProdDate: Date; // Keep as Date for processing
  DeptID: string;
  OrderID: string;
  OrderType: string;
  LocID: string;
  Remark: string;
  ItemID: string;
  ItemType: string;
  Bags: number;
  Kgs: number;
  BagsLeft: number;
  KgsLeft: number;
  UserName: string;
  UserDateTime: string;
  HPPPrice: number;
  JamMulai: string;
  JamSelesai: string;
  BomRef: string;
  BomDate: string;
  Shift: string;
  Machine: string;
  Printed: string;
  NoBuktiB: string;
  NoBuktiH: string;
  rjn: string;
  CMesin1: string;
  CMesin2: string;
  CreateBOM: string;
  BOMRef: string;
  ProdIDlama: string;
  Notes: string;
  area: string;
  AreaSisa: number;
  PcsReject: number;
  Kgsreject: number;
  KgsAvalan: number;
  BagsAvalan: number;
  BagsProngkolan: number;
  KgsSusut: number;
  FGGroup0: string;
  Selesai: string;
  KgsProngkolan: number;
  Batch: string;
  NIKOpr1: string;
  NIKOpr2: string;
  ItemIDLeft: string;
  KgsBefore: number;
  BagsBefore: number;
  bags2: number;
  TransIDMixing: string;
  Keterangan: string;
  NO_Rator: number;
  DateValue: string;
  NoRator: number;
  Tanggal: Date;
  Departemen: string;
  Spk: string;
  Nama_PO: string;
  Tipe_Produksi: string;
  Gudang: string;
  Kategori: string;
};

// lib/types/tracking-pemasukan.ts

// ============================================
// TYPE UNTUK PEMAKAIAN PRODUKSI (Versi Lama)
// ============================================
export interface ProduksiUsage {
  ProdID_Bahan: string;
  SPK: string;
  Tanggal_Produksi: string | null;
  Jumlah_Bahan: number;
  PIC_Bahan: string;
}



// lib/types/tracking-pemasukan.ts

export interface PemakaianDetail {
  No_Transaksi: string;
  SPK: string;
  Tanggal: string;
  Jumlah: number;
  PIC: string;
  Sumber: "PRODUKSI" | "OPNAME";
  Keterangan: string;
  ItemID_Original?: string;
}

export interface BarangJadi {
  ProdID_Hasil: string;
  ItemID: string;
  NamaBarang: string;
  Jumlah_Kgs: number;
  Tanggal_Produksi: string;
  SPK: string;
  PIC_Hasil: string;
}

export interface TrackingItem {
  ItemID_Bahan: string;
  ItemID_Original: string;
  NamaBahan: string;
  Kategori: string;
  JenisDokumen: string;
  NomorBPB: string;
  TanggalBPB: string | null; // Berisi SEMUA tanggal masuk (gabungan)
  Pemasok: string;
  JumlahMasuk_Kgs: number;
  JumlahPemasukan: number;
  StokAwal: number;
  TotalStokTersedia: number;
  StockSekarang: number;
  DigunakanDiProduksi: PemakaianDetail[];
  TotalKgsTerpakai: number;
  PersentaseTerpakai: number;
  PemakaianProduksi: PemakaianDetail[];
  PemakaianOpname: PemakaianDetail[];
  TotalProduksi: number;
  TotalOpname: number;
  MenghasilkanBarangJadi: BarangJadi[];
  TotalBarangJadi: number;
  StatusStock: string;
  StatusBg: string;
  IsOverUsed: boolean;
  HasPemakaian: boolean;
  HasPemakaianProduksi: boolean;
  HasPemakaianOpname: boolean;
  JumlahPemakaian: number;
  JumlahPemakaianProduksi: number;
  JumlahPemakaianOpname: number;
}