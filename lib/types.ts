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

export interface MutasiType{
  KodeBarang: string;
  NamaBarang: string;
  Satuan: string;
  saldoawal:number;
  Pemasukan:number;
  Pengeluaran:number;
  Penyesuaian:number;
  SaldoAkhir:number;
  stokopname:number;
  selisih:number;
  Keterangan:string;
  Pencacahan:number;
  }