import os

try:
    from dotenv import load_dotenv, find_dotenv
    # Load standard .env
    load_dotenv(find_dotenv(usecwd=True))
    # If key is still missing, check .env.example as a fallback
    if not (os.getenv("NVIDIA_API_KEY") or os.getenv("NVAPI_KEY")):
        env_example = find_dotenv(".env.example", usecwd=True)
        if env_example:
            load_dotenv(env_example)
except ImportError:
    pass

try:
    from openai import OpenAI
    _OPENAI_IMPORT_OK = True
except ImportError:
    _OPENAI_IMPORT_OK = False


class LLMInterface:
    """
    LLM wrapper connecting to NVIDIA NIM (Inference Microservices) via OpenAI SDK compatibility.
    Falls back to a mock response if NVIDIA_API_KEY is missing, openai is not installed,
    or if the API request encounters any error.
    """

    DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
    DEFAULT_MODEL = "meta/llama-3.2-11b-vision-instruct"

    def __init__(self, model: str = None):
        # Allow override via parameter or env var NVIDIA_MODEL
        self.model = model or os.getenv("NVIDIA_MODEL", self.DEFAULT_MODEL)
        self.api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("NVAPI_KEY")
        self.base_url = os.getenv("NVIDIA_BASE_URL", self.DEFAULT_BASE_URL)
        self.client = None

        if not self.api_key:
            print("\n[LLM Info] NVIDIA_API_KEY is not set. Running in [MOCK] mode.")
        elif not _OPENAI_IMPORT_OK:
            print("\n[LLM Warning] 'openai' python package is not installed. Running in [MOCK] mode.")
        else:
            try:
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url,
                )
                masked_key = self.api_key[:8] + "..." + self.api_key[-4:] if len(self.api_key) > 12 else "configured"
                print(f"\n[LLM Ready] Initialized NVIDIA NIM client (model: {self.model}, key: {masked_key}).")
            except Exception as e:
                print(f"\n[LLM Init Error] Could not initialize NVIDIA NIM client: {e}")
                self.client = None

    def generate_response(self, system_prompt: str, user_message: str, history_list: list) -> str:
        """
        Builds the standard messages array, queries NVIDIA NIM, and returns the response.
        Falls back to a mock string if no client/API key is configured, or if the
        API call fails for any reason.
        """
        messages = (
            [{"role": "system", "content": system_prompt}]
            + history_list
            + [{"role": "user", "content": user_message}]
        )

        if self.client is None:
            return f"[MOCK] This is a simulated interviewer response for: {user_message}"

        # Candidate models to try in order if the primary model encounters a 404/service error
        models_to_try = [
            self.model,
            "meta/llama-3.2-11b-vision-instruct",
            "meta/llama-3.2-90b-vision-instruct",
        ]
        # Deduplicate while preserving order
        models_to_try = list(dict.fromkeys(models_to_try))

        last_error = None

        for m in models_to_try:
            try:
                completion = self.client.chat.completions.create(
                    model=m,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=256,
                    top_p=1.0,
                    timeout=45.0,
                )
                if completion.choices and completion.choices[0].message:
                    reply = completion.choices[0].message.content
                    if reply and reply.strip():
                        return reply.strip()
            except Exception as e:
                last_error = e
                # If model not found or unavailable, try next candidate
                err_str = str(e).lower()
                if "404" in err_str or "not found" in err_str or "model" in err_str:
                    continue
                else:
                    break

        print(f"\n[LLM API Error] NVIDIA NIM call failed: {last_error}")
        return f"[MOCK] This is a simulated interviewer response for: {user_message}"
