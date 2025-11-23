// Função para gerar o HTML estilizado
import { theme } from "../theme/colors";
import { Cliente, ProdutoSelecionado } from "../types/interfaces";
export const generateOrcamentoHTML = (
  orcamentoId: number | undefined,
  cliente: Cliente | null,
  produtos: ProdutoSelecionado[],
  subtotal: number,
  desconto: number,
  total: number,
  observacoes: string,
  status: string
) => {
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  // Cores baseadas no seu tema (pode ajustar aqui)
  const primaryColor = theme.colors.primary || "#4F46E5";
  const secondaryColor = "#F3F4F6";
  const textColor = "#1F2937";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orçamento</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: ${textColor};
                margin: 0;
                padding: 40px;
                line-height: 1.5;
            }
            .header-bar {
                background-color: ${primaryColor};
                height: 10px;
                width: 100%;
                position: absolute;
                top: 0;
                left: 0;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                border-bottom: 2px solid ${secondaryColor};
                padding-bottom: 20px;
            }
            .logo-area h1 {
                margin: 0;
                color: ${primaryColor};
                font-size: 28px;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            .invoice-info {
                text-align: right;
            }
            .invoice-info h2 {
                margin: 0;
                font-size: 16px;
                color: #6B7280;
                text-transform: uppercase;
            }
            .invoice-info p {
                margin: 5px 0 0;
                font-size: 14px;
                font-weight: bold;
            }
            
            .columns {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            .col {
                width: 48%;
            }
            .col-title {
                font-size: 12px;
                color: #6B7280;
                text-transform: uppercase;
                font-weight: bold;
                margin-bottom: 10px;
                border-bottom: 1px solid #E5E7EB;
                padding-bottom: 5px;
            }
            .address p {
                margin: 2px 0;
                font-size: 14px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            th {
                background-color: ${secondaryColor};
                color: ${textColor};
                font-weight: bold;
                text-align: left;
                padding: 12px;
                font-size: 12px;
                text-transform: uppercase;
            }
            td {
                padding: 12px;
                border-bottom: 1px solid #E5E7EB;
                font-size: 14px;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .totals-section {
                display: flex;
                justify-content: flex-end;
            }
            .totals-box {
                width: 250px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #E5E7EB;
            }
            .total-row.final {
                border-bottom: none;
                border-top: 2px solid ${primaryColor};
                margin-top: 10px;
                padding-top: 15px;
                font-size: 18px;
                font-weight: bold;
                color: ${primaryColor};
            }

            .notes {
                margin-top: 40px;
                padding: 15px;
                background-color: #F9FAFB;
                border-radius: 4px;
                font-size: 12px;
                color: #6B7280;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #9CA3AF;
            }
        </style>
    </head>
    <body>
        <div class="header-bar"></div>
        
        <div class="header">
            <div class="logo-area">
                <h1>Smart Move</h1>
                <p style="font-size: 12px; color: #666;">Soluções em Gestão</p>
            </div>
            <div class="invoice-info">
                <h2>Orçamento</h2>
                <p>#${orcamentoId || "NOVO"}</p>
                <p style="font-weight: normal; font-size: 12px; margin-top: 5px;">Data: ${dataHoje}</p>
                <span style="background: ${
                  status === "APROVADO" ? "#DEF7EC" : "#FEF3C7"
                }; color: ${
    status === "APROVADO" ? "#03543F" : "#92400E"
  }; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
                    ${status}
                </span>
            </div>
        </div>

        <div class="columns">
            <div class="col">
                <div class="col-title">De:</div>
                <div class="address">
                    <p><strong>Smart Move Ltda</strong></p>
                    <p>Rua da Tecnologia, 1000</p>
                    <p>São Paulo - SP</p>
                    <p>contato@smartmove.com.br</p>
                </div>
            </div>
            <div class="col">
                <div class="col-title">Para:</div>
                <div class="address">
                    <p><strong>${
                      cliente?.nome || "Cliente não informado"
                    }</strong></p>
                    <p>${
                      cliente?.documento ? `CPF/CNPJ: ${cliente.documento}` : ""
                    }</p>
                    <p>${cliente?.telefone || ""}</p>
                    <p>${cliente?.email || ""}</p>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 50%;">Descrição</th>
                    <th class="text-center">Qtd</th>
                    <th class="text-right">Valor Unit.</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${produtos
                  .map(
                    (p) => `
                    <tr>
                        <td>
                            <strong>${p.nome}</strong>
                            ${
                              p.referencia
                                ? `<br><span style="font-size: 10px; color: #888;">Ref: ${p.referencia}</span>`
                                : ""
                            }
                        </td>
                        <td class="text-center">${p.quantity}</td>
                        <td class="text-right">R$ ${Number(p.valorVenda)
                          .toFixed(2)
                          .replace(".", ",")}</td>
                        <td class="text-right">R$ ${(
                          Number(p.valorVenda) * p.quantity
                        )
                          .toFixed(2)
                          .replace(".", ",")}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="totals-box">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>R$ ${subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                ${
                  desconto > 0
                    ? `
                <div class="total-row" style="color: #EF4444;">
                    <span>Desconto:</span>
                    <span>- R$ ${desconto.toFixed(2).replace(".", ",")}</span>
                </div>
                `
                    : ""
                }
                <div class="total-row final">
                    <span>Total:</span>
                    <span>R$ ${total.toFixed(2).replace(".", ",")}</span>
                </div>
            </div>
        </div>

        ${
          observacoes
            ? `
        <div class="notes">
            <strong>Observações:</strong><br>
            ${observacoes.replace(/\n/g, "<br>")}
        </div>
        `
            : ""
        }

        <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Este documento não possui valor fiscal.</p>
        </div>
    </body>
    </html>
  `;
};
