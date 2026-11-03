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

- A **primeira conta criada** no painel fica com acesso automaticamente.
- Qualquer outra conta consegue entrar, mas não vê nem altera dados.
- Para liberar mais alguém, rode no SQL Editor do Supabase, depois que a pessoa criar a conta:

```sql
insert into public.membros (user_id, email)
select id, email from auth.users where email = 'email-da-pessoa@exemplo.com';
```

## Tabelas

`lancamentos`, `notas`, `obrigacoes`, `modelos` (obrigações recorrentes), `beneficios` (valores do 13º por ano), `config` (alíquota do DAS) e `membros`.

## Regras de cálculo

- **DAS estimado** = faturado nas notas do mês × alíquota efetiva. Vence no dia 20 do mês seguinte.
- **Vencimento em fim de semana ou feriado:** o DAS passa para o próximo dia útil; INSS e FGTS são antecipados.
- **13º** = soma dos meses lançados ÷ número de meses com valor.
- **Férias** = 13º + 1/3 do 13º.

## Como atualizar

Altere o `index.html` e envie:

```
git add .
git commit -m "o que mudou"
git push
```

O GitHub Pages publica a nova versão em um ou dois minutos.
