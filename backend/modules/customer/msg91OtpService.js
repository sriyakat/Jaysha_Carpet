const MSG91_API_URL = "https://control.msg91.com/api/v5/otp";

const getConfig = () => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
        const error = new Error("OTP service is not configured. Add MSG91_AUTH_KEY and MSG91_TEMPLATE_ID to backend/.env.");
        error.statusCode = 503;
        throw error;
    }

    if (
        authKey.includes("your_actual")
        || templateId.includes("your_actual")
        || authKey.trim().length < 20
    ) {
        const error = new Error("OTP service credentials are still placeholders. Configure a valid MSG91 auth key and approved OTP template in backend/.env.");
        error.statusCode = 503;
        throw error;
    }

    return { authKey, templateId };
};

const getMobileForProvider = (mobileNumber) => {
    const digits = String(mobileNumber || "").replace(/\D/g, "");
    const localNumber = digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits;

    if (!/^[6-9]\d{9}$/.test(localNumber)) {
        const error = new Error("Enter a valid Indian mobile number.");
        error.statusCode = 400;
        throw error;
    }

    return `91${localNumber}`;
};

const parseProviderResponse = async (response, failureStatus = 502) => {
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || String(payload.type).toLowerCase() !== "success") {
        const providerMessage = payload?.message || payload?.error || payload?.type;
        const error = new Error(
            providerMessage
                ? `MSG91 OTP request failed: ${providerMessage}`
                : "MSG91 could not complete the OTP request."
        );
        error.statusCode = response.status === 429 ? 429 : failureStatus;
        error.providerStatus = response.status;
        error.providerPayload = payload;
        throw error;
    }

    return payload;
};

const sendOtp = async (mobileNumber) => {
    const { authKey, templateId } = getConfig();
    const mobile = getMobileForProvider(mobileNumber);
    const query = new URLSearchParams({
        template_id: templateId,
        mobile,
        otp_length: "6",
        otp_expiry: "5",
    });

    let response;
    try {
        response = await fetch(`${MSG91_API_URL}?${query}`, {
            method: "POST",
            headers: {
                authkey: authKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });
    } catch (cause) {
        const error = new Error("Could not connect to the OTP service.");
        error.statusCode = 502;
        error.cause = cause;
        throw error;
    }

    return parseProviderResponse(response);
};

const verifyOtp = async (mobileNumber, otp) => {
    const { authKey } = getConfig();
    const mobile = getMobileForProvider(mobileNumber);
    const query = new URLSearchParams({ mobile, otp });

    let response;
    try {
        response = await fetch(`${MSG91_API_URL}/verify?${query}`, {
            method: "GET",
            headers: { authkey: authKey },
        });
    } catch (cause) {
        const error = new Error("Could not connect to the OTP service.");
        error.statusCode = 502;
        error.cause = cause;
        throw error;
    }

    return parseProviderResponse(response, 401);
};

module.exports = {
    sendOtp,
    verifyOtp,
};
