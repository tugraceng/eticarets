/* Smoke test: kupon kodu + kargo + sipariş iptal */
const API = "http://localhost:4000/api";

async function req(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
}

(async () => {
  console.log("== 1. login admin ==");
  const adminLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@store.local", password: "ChangeMe123!" }),
  });
  console.log("status:", adminLogin.status);
  const admin = adminLogin.data.accessToken;
  if (!admin) throw new Error("admin token missing");

  console.log("\n== 2. settings: add shipping fee ==");
  const upd = await req("/settings", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({
      shippingFeeCents: 2999,
      freeShippingThresholdCents: 100000,
    }),
  });
  console.log("status:", upd.status);

  const s = await req("/settings");
  console.log("shipping:", s.data.shippingFeeCents, "threshold:", s.data.freeShippingThresholdCents);

  console.log("\n== 3. create discount code ==");
  const created = await req("/discounts", {
    method: "POST",
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({
      code: "SMOKE10",
      kind: "PERCENT",
      value: 10,
      minSubtotalCents: 0,
      isActive: true,
    }),
  });
  console.log("status:", created.status, "id:", created.data?.id);

  console.log("\n== 4. validate code ==");
  const v = await req("/discounts/validate", {
    method: "POST",
    body: JSON.stringify({ code: "smoke10", subtotalCents: 50000 }),
  });
  console.log("status:", v.status, "discountCents:", v.data?.discountCents);

  console.log("\n== 5. list products ==");
  const products = await req("/products");
  const prod = Array.isArray(products.data) ? products.data[0] : null;
  if (!prod) throw new Error("no products");
  console.log("using:", prod.name, prod.priceCents);

  console.log("\n== 6. register customer & get token ==");
  const email = `smoke_${Date.now()}@test.local`;
  const reg = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "secret12",
      name: "Smoke",
      surname: "Tester",
      phone: "05551112233",
      kvkkAccepted: true,
    }),
  });
  const ctoken = reg.data?.accessToken;
  console.log("status:", reg.status, "token:", ctoken ? "ok" : "missing");

  console.log("\n== 7. create order with coupon ==");
  const orderRes = await req("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${ctoken}` },
    body: JSON.stringify({
      items: [{ productId: prod.id, quantity: 1 }],
      contactName: "Smoke Tester",
      contactPhone: "05551112233",
      shippingLine1: "Sokak 1 No:5",
      shippingCity: "İstanbul",
      shippingPostalCode: "34000",
      kvkkAccepted: true,
      distanceSalesAccepted: true,
      discountCode: "SMOKE10",
    }),
  });
  console.log("status:", orderRes.status);
  if (orderRes.status >= 400) {
    console.log("body:", orderRes.data);
    return;
  }
  const order = orderRes.data;
  console.log(
    "subtotal:",
    order.subtotalCents,
    "discount:",
    order.discountCents,
    "ship:",
    order.shippingCents,
    "total:",
    order.totalCents,
  );

  console.log("\n== 8. cancel order ==");
  const cancel = await req(`/orders/${order.id}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ctoken}` },
  });
  console.log("status:", cancel.status, "newStatus:", cancel.data?.status);

  console.log("\n== 9. address CRUD ==");
  const add = await req("/customers/me/addresses", {
    method: "POST",
    headers: { Authorization: `Bearer ${ctoken}` },
    body: JSON.stringify({
      label: "Ev",
      contactName: "Smoke Tester",
      phone: "05551112233",
      line1: "Mah. Sokak",
      city: "İstanbul",
      postalCode: "34000",
    }),
  });
  console.log("add:", add.status, "isDefault:", add.data?.isDefault);
  const addrId = add.data?.id;
  const list = await req("/customers/me/addresses", {
    headers: { Authorization: `Bearer ${ctoken}` },
  });
  console.log("list count:", Array.isArray(list.data) ? list.data.length : "err");
  if (addrId) {
    const del = await req(`/customers/me/addresses/${addrId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ctoken}` },
    });
    console.log("delete:", del.status);
  }

  console.log("\n== 10. change password ==");
  const pw = await req("/customers/me/password", {
    method: "POST",
    headers: { Authorization: `Bearer ${ctoken}` },
    body: JSON.stringify({ currentPassword: "secret12", newPassword: "secret345" }),
  });
  console.log("pw:", pw.status);

  console.log("\n== 11. cleanup discount ==");
  await req(`/discounts/${created.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${admin}` },
  });
  console.log("ok");

  console.log("\n== 12. revert shipping ==");
  await req("/settings", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ shippingFeeCents: 0, freeShippingThresholdCents: 0 }),
  });
  console.log("done");
})().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
