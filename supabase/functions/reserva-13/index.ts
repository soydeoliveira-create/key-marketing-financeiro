// Reserva do 13º por e-mail: roda todo dia 5 (pg_cron) e manda a cada conta no modo RH
// quanto guardar no mês para o 13º de cada funcionário. Mesma conta do painel (index.html, reservaCalc).
// Segredos da função: RESEND_API_KEY (obrigatório) e EMAIL_REMETENTE (opcional).
// Teste sem enviar: body {"teste":true,"dono":"<uuid>","mes":"AAAA-MM"} devolve o e-mail em HTML.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const FGTS = 0.08;
const r2 = (v: number) => Math.round(v * 100) / 100;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pad = (n: number) => String(n).padStart(2, "0");
const ym = (y: number, m: number) => `${y}-${pad(m)}`;
const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

type Func = { id: string; nome: string; regime: string; admissao: string | null; ativo: boolean | null };

function reserva(y: number, mRef: number, f: Func, sal: Record<string, number>) {
  if (!f.admissao) return null;
  const admY = +f.admissao.slice(0, 4), admM = +f.admissao.slice(5, 7);
  const ini = y < admY ? 13 : y === admY ? admM : 1;
  if (ini > 12) return null;
  const tot = 13 - ini, fat = f.regime === "pj" ? 1 : 1 + FGTS;
  let ultimo = 0;
  for (let m = ini; m <= 12 && !ultimo; m++) ultimo = sal[ym(y, m)] || 0;
  if (!ultimo) return null;
  const meses: { valor: number; est: boolean }[] = [];
  for (let m = ini; m <= 12; m++) {
    const v = sal[ym(y, m)] || 0;
    if (v > 0) ultimo = v;
    meses[m] = { valor: r2(ultimo / tot * fat), est: !(v > 0) };
  }
  const soma = (a: number, b: number) => meses.slice(a, b + 1).reduce((s, x) => s + (x ? x.valor : 0), 0);
  return { f, tot, doMes: meses[mRef] || null, ate: r2(soma(0, mRef)), ano: r2(soma(0, 12)) };
}

function email(empresa: string, y: number, m: number, rs: NonNullable<ReturnType<typeof reserva>>[]) {
  const nm = MESES[m - 1];
  const mes = r2(rs.reduce((a, r) => a + (r.doMes?.valor || 0), 0));
  const ate = r2(rs.reduce((a, r) => a + r.ate, 0)), ano = r2(rs.reduce((a, r) => a + r.ano, 0));
  const est = rs.some((r) => r.doMes?.est), clt = rs.some((r) => r.f.regime !== "pj");
  const linhas = rs.map((r) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e6e3dc"><b>${esc(r.f.nome)}</b><br><span style="color:#7b8088;font-size:12px">salário ÷ ${r.tot} ${r.tot === 1 ? "mês" : "meses"}${r.f.regime === "pj" ? "" : " + 8% de FGTS"}</span></td><td style="padding:8px 0;border-bottom:1px solid #e6e3dc;text-align:right;white-space:nowrap"><b>${brl(r.doMes?.valor || 0)}</b>${r.doMes?.est ? '<br><span style="color:#7b8088;font-size:12px">estimado</span>' : ""}</td></tr>`).join("");
  const assunto = `Reserva do 13º de ${nm}: guardar ${brl(mes)}`;
  const html = `<!doctype html><html><body style="margin:0;background:#F7F6F2;font-family:Arial,Helvetica,sans-serif;color:#2E3338">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#0B2D3B;color:#F7F6F2;border-radius:14px;padding:20px 22px">
<div style="font-size:12px;letter-spacing:2px;color:#A7AFC7">RESERVA DO 13º · ${nm.toUpperCase()} DE ${y}</div>
<div style="font-size:15px;margin-top:6px">${esc(empresa)}</div>
<div style="font-size:13px;color:#D9C8B1;margin-top:14px">Guardar este mês</div>
<div style="font-size:32px;font-weight:bold">${brl(mes)}</div></div>
<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">${linhas}</table>
<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:14px">
<tr><td style="padding:4px 0">Guardado até ${nm}</td><td style="text-align:right"><b>${brl(ate)}</b></td></tr>
<tr><td style="padding:4px 0">Falta até dezembro</td><td style="text-align:right"><b>${brl(r2(Math.max(0, ano - ate)))}</b></td></tr>
<tr><td style="padding:4px 0">Reserva do ano (13º${clt ? " + FGTS" : ""})</td><td style="text-align:right"><b>${brl(ano)}</b></td></tr></table>
<p style="font-size:12px;color:#7b8088;line-height:1.5;margin-top:16px">Separe o valor do mês numa conta ou aplicação só do 13º. Somando o ano, a reserva fecha com o 13º em dezembro.${est ? " <b>Estimado</b> = o salário do mês ainda não foi lançado no painel; o valor usa o último salário." : ""}</p>
<p style="font-size:11px;color:#A7AFC7;letter-spacing:2px;margin-top:20px">AIME FINANCY · UM PRODUTO AIME TECH</p>
</div></body></html>`;
  return { assunto, html, mes };
}

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: seg } = await db.from("segredos").select("valor").eq("nome", "cron_token").single();
  if (!seg || req.headers.get("x-cron-token") !== seg.valor) return new Response("não autorizado", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const agora = new Date(Date.now() - 3 * 3600e3); // horário de Brasília
  const [y, m] = (body.mes || ym(agora.getUTCFullYear(), agora.getUTCMonth() + 1)).split("-").map(Number);
  const k = ym(y, m);

  let q = db.from("config").select("dono,empresa_nome,reserva_email,reserva_enviada,reserva_auto,modo").eq("modo", "rh");
  if (body.dono) q = q.eq("dono", body.dono);
  const { data: contas, error } = await q;
  if (error) return Response.json({ erro: error.message }, { status: 500 });

  const chave = Deno.env.get("RESEND_API_KEY");
  const de = Deno.env.get("EMAIL_REMETENTE") || "AIME Financy <onboarding@resend.dev>";
  const saida: unknown[] = [];

  for (const c of contas || []) {
    if (!body.teste && (!c.reserva_auto || c.reserva_enviada === k)) { saida.push({ dono: c.dono, pulou: c.reserva_auto ? "já enviado" : "desligado" }); continue; }
    const [{ data: funcs }, { data: sals }] = await Promise.all([
      db.from("funcionarios").select("id,nome,regime,admissao,ativo").eq("dono", c.dono),
      db.from("clt_salarios").select("funcionario,id,valor").eq("dono", c.dono).like("id", `${y}-%`),
    ]);
    const porF: Record<string, Record<string, number>> = {};
    for (const s of sals || []) (porF[s.funcionario] ||= {})[s.id] = +s.valor || 0;
    const rs = (funcs || []).filter((f) => f.ativo !== false)
      .map((f) => reserva(y, m, f as Func, porF[f.id] || {})).filter((r) => r !== null)
      .sort((a, b) => a!.f.nome.localeCompare(b!.f.nome, "pt")) as NonNullable<ReturnType<typeof reserva>>[];
    if (!rs.length) { saida.push({ dono: c.dono, pulou: "sem salários lançados" }); continue; }

    const e = email(c.empresa_nome || "Sua empresa", y, m, rs);
    let para = (c.reserva_email || "").trim();
    if (!para) { const { data: u } = await db.auth.admin.getUserById(c.dono); para = u?.user?.email || ""; }
    if (body.teste) { saida.push({ dono: c.dono, para, assunto: e.assunto, html: e.html }); continue; }
    if (!chave) { saida.push({ dono: c.dono, erro: "falta o segredo RESEND_API_KEY" }); continue; }
    if (!para) { saida.push({ dono: c.dono, erro: "sem e-mail" }); continue; }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: para.split(/[,;\s]+/).filter(Boolean), subject: e.assunto, html: e.html }),
    });
    if (r.ok) { await db.from("config").update({ reserva_enviada: k }).eq("dono", c.dono); saida.push({ dono: c.dono, para, enviado: k }); }
    else saida.push({ dono: c.dono, para, erro: await r.text() });
  }
  return Response.json({ mes: k, contas: saida });
});
