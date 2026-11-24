import client from "./client";

// Map the API's user shape to our employee shape.
const toEmployee = (u) => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone,
  age: u.age,
  department: u.company?.department ?? u.department ?? "",
  title: u.company?.title ?? u.title ?? "",
});

// Reusable API functions (GET, POST, PUT, DELETE).
export async function fetchEmployees() {
  // limit=0 returns every record so search/filter/sort/pagination can run on the frontend.
  const { data } = await client.get("/users", {
    params: { limit: 0, select: "firstName,lastName,email,phone,age,company" },
  });
  return data.users.map(toEmployee);
}

export async function createEmployee(payload) {
  const { data } = await client.post("/users/add", payload);
  return { ...toEmployee({ ...payload, ...data }), local: true };
}

export async function updateEmployee(id, payload) {
  const { data } = await client.put(`/users/${id}`, payload);
  return toEmployee({ ...payload, ...data, id });
}

export async function deleteEmployee(id) {
  await client.delete(`/users/${id}`);
  return id;
}
