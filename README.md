# Financeiro Key Marketing

Painel financeiro da **Key Marketing Digital**: entradas e saídas, notas fiscais emitidas, impostos e obrigações, calendário de vencimentos e provisão de 13º e férias.

**Painel:** https://soydeoliveira-create.github.io/key-marketing-financeiro/

## Onde ficam as coisas

| O quê | Onde |
| --- | --- |
| Código do painel (`index.html`) | Este repositório, publicado pelo GitHub Pages |
| Dados (lançamentos, notas, impostos, 13º) | Supabase, projeto `key-marketing-financeiro` (São Paulo) |
| Login | Supabase Auth, com e-mail e senha |

A chave que aparece no `index.html` é a chave **pública** do Supabase. Ela sozinha não lê nada: as tabelas só respondem para quem entrou com uma conta liberada.

## Quem tem acesso

- Qualquer pessoa pode criar a própria conta em "Primeiro acesso? Criar minha conta".
- **Cada conta tem o seu próprio financeiro.** Toda tabela tem a coluna `dono` (o usuário que criou a linha), e as regras de acesso (RLS) só deixam cada conta ler e alterar as próprias linhas. Uma conta não vê nada das outras.
- A chave de cada tabela é `(dono, id)` (em `beneficios`, `(dono, ano)`), então duas contas podem ter, por exemplo, o mesmo `das-2026-11`.
- **Marca de cada conta:** botão "Empresa" no topo (nome, CNPJ, logo e duas cores), guardado em `config` (`empresa_nome`, `cnpj`, `logo` como imagem pequena em data URL, `cor_principal`, `cor_destaque`). `logo = 'key'` usa o logo da Key. A tela de login mostra a última marca usada no navegador.
- **Funcionários:** tabela `funcionarios` (nome, cargo, CPF, regime CLT ou PJ, admissão, dependentes, `eu`). `clt_salarios` e `descontos` têm a coluna `funcionario`; a chave de `clt_salarios` é `(dono, funcionario, id)`. O funcionário com `eu = true` entra no quadro "Seu fim de ano".
- Conta nova já começa com a configuração (alíquota 6%) e com DAS e DEFIS cadastrados. Isso é feito pela função `primeiro_membro`, no gatilho `ao_criar_usuario`.

## Tabelas

`lancamentos`, `notas`, `obrigacoes`, `modelos` (obrigações recorrentes), `beneficios` (valores do 13º da PJ por ano), `clt_salarios` (salário bruto CLT por mês, pessoa física), `descontos` (outros descontos da CLT, como plano de saúde e empréstimo), `config` (alíquota do DAS, início da PJ, dados da CLT) e `membros`.

## Regras de cálculo

- **DAS estimado** = faturado nas notas do mês × alíquota efetiva. Vence no dia 20 do mês seguinte.
- **Vencimento em fim de semana ou feriado:** o DAS passa para o próximo dia útil; INSS e FGTS são antecipados.
- **13º** = soma dos meses lançados ÷ número de meses com valor.
- **Férias** = 13º + 1/3 do 13º.
- Na PJ, só o recebimento do dia 5 entra no 13º e nas férias, e 2026 conta a partir de abril (início da PJ).

### CLT (pessoa física)

Separada de tudo da PJ. Usa o salário **bruto** lançado mês a mês, a partir da data de admissão:

- **13º** = soma dos salários do ano ÷ número de meses com salário.
- **Férias** = 13º + 1/3 do 13º.
- **Líquido estimado**: desconta INSS (tabela de 2026, 7,5% a 14%, teto R$ 8.475,55) e IR (tabela da Receita de 2026 com a redução da Lei 15.270/2025; R$ 189,59 por dependente). No 13º o IR é separado e só deduz INSS e dependentes; nas férias vale o desconto simplificado de R$ 607,20 quando for maior.

## Como atualizar

Altere o `index.html` e envie:

```
git add .
git commit -m "o que mudou"
git push
```

O GitHub Pages publica a nova versão em um ou dois minutos.
