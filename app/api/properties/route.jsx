import connectDB from "@/config/database.js";

// GET /api/properties
export const GET = async (request) => {
  try {
    await connectDB();
    
    return new Response(JSON.stringify({ message: "Hello World" }), {
        status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error" }), {
        status: 500,
    });
    }
  };