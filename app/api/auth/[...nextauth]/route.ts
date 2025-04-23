import NextAuth from "next-auth";
import { authOptions } from "../config/options";

// Tạo handler từ cấu hình đã được di chuyển
const handler = NextAuth(authOptions);

// Export các hàm handler cho các phương thức HTTP
export { handler as GET, handler as POST };