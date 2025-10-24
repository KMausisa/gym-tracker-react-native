import { client } from "../config/db.js";

export class supabaseServiceClass {
  constructor() {
    this.supabaseClient = client;
  }

  // Handle all CRUD operations here

  async testAdding(name) {
    const { error } = await this.supabaseClient
      .from("testing")
      .insert([{ name }]);

    if (error) {
      console.log(error);
      return { error: error.message };
    }

    return { message: "User added successfully!" };
  }
}

export const supabaseService = new supabaseServiceClass();
