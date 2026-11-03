# Financeiro Key Marketing

Painel financeiro da **Key Marketing Digital**: entradas e saídas, notas fiscais emitidas, impostos e obrigações, calendário de vencimentos e provisão de 13º e férias.

**Painel em uso:** https://claude.ai/artifact/Svw8dJrhdPQs9pmySbk6FA

## O que fica aqui e o que não fica

Este repositório guarda **o código** do painel (`index.html`) e o histórico das versões.

**Os dados não ficam aqui.** Lançamentos, notas, obrigações e os valores do 13º ficam no banco de dados do próprio Artifact no claude.ai e só aparecem pelo link acima. Aberto fora do claude.ai (direto no navegador ou pelo GitHub Pages), o painel mostra a tela, mas avisa que não consegue salvar nada.

## Abas

| Aba | Para que serve |
| --- | --- |
| Visão geral | Entradas, saídas, resultado do mês, o que falta pagar e próximos vencimentos |
| Entradas e saídas | Lançamentos do mês por categoria; exporta CSV |
| Notas fiscais | Notas emitidas; "Recebi" lança o valor nas entradas |
| Impostos e obrigações | DAS, INSS, DEFIS e outras; "Marcar pago" lança a saída |
| Calendário | Vencimentos do mês, com feriados nacionais |
| 13º e férias | Média do que a PJ recebeu no ano |

## Regras de cálculo

- **DAS estimado** = faturado nas notas do mês × alíquota efetiva (configurável na aba de impostos). Vence no dia 20 do mês seguinte.
- **Vencimento em fim de semana ou feriado:** o DAS passa para o próximo dia útil; INSS e FGTS são antecipados.
- **13º** = soma dos meses lançados ÷ número de meses com valor.
- **Férias** = 13º + 1/3 do 13º.

## Como atualizar

1. Altere o `index.html` (ou peça a alteração ao Claude).
2. Republique o Artifact no mesmo link, para que o painel em uso receba a mudança.
3. Envie para o GitHub:

```
git add .
git commit -m "o que mudou"
git push
```
