export interface Municipio {
  id: number;
  nome: string;
  uf: string;
}

export interface Bairro {
  id: number;
  nome: string;
  municipioId?: number;
  municipio?: Municipio;
  status: string;
}
export interface Cliente {
  id: number;
  nome: string;
  documento: string | null;
  telefone: string | null;
  endereco: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string; // "ATIVO" ou "INATIVO"
  bairro?: Bairro;
  bairroId: number;
}

export interface ItemRota {
  id: number;
  bairro: Bairro;
}

export interface Rota {
  id: number;
  nome: string;
  status: string;
  itensRota: ItemRota[];
}

export interface VendaItem {
  vendaId: number;
  produtoId: number;
  quantidade: number;
  valorUnitario: string;
  subTotal: string;
  produto: Produto;
}

export interface FormaPagamento {
  id: number;
  nome: string;
  aceitaParcelamento: boolean;
  status: string;
}
export interface VendaPagamento {
  id: number;
  vendaId: number;
  formaPagamentoId: number;
  valorPago: string;
  parcelas: number;
}

export interface Venda {
  id: number;
  data: string;
  valorTotal: string;
  desconto: string;
  observacoes: string;
  status: string;
  clienteId: number;
  usuarioId: number;
  cliente: Cliente;
  itens: VendaItem[];
  pagamentos: VendaPagamento[];
}

export interface Produto {
  id: number;
  nome: string;
  marca: string | null;
  referencia: string | null;
  valorVenda: string;
  custo: string | null;
  estoque: number | null;
  status: string;
}

export interface OrcamentoItem {
  orcamentoId: number;
  produtoId: number;
  quantidade: number;
  valorUnitario: string;
  subTotal: string;
  produto: Produto;
}

export interface Orcamento {
  id: number;
  data: string;
  valorTotal: string;
  desconto: string;
  observacoes: string;
  status: string;
  clienteId: number;
  usuarioId: number;
  cliente: Cliente;
  itens: OrcamentoItem[];
}

export interface ProdutoSelecionado extends Produto {
  quantity: number;
}
