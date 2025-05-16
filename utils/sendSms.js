import axios from "axios";

export const sendSms = async ({ to, message }) => {
  try {
    const API_KEY = process.env.MNOTIFY_API_KEY;
    const url = "https://api.mnotify.com/api/sms/quick";

    const response = await axios.post(url, null, {
      params: {
        key: API_KEY,
        recipient: [to],
        message,
        sender: "tricycle",
      },
    });

    console.log("MNotify response:", response.data);
    return response.data;
  } catch (error) {
    console.error("SMS sending failed:", error.response?.data || error.message);
    throw error;
  }
};
