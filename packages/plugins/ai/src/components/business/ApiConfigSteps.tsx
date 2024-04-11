import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiConfig } from "@/plugins/fetch-llm";

export type ComponentProps = {
  apiConfig: ApiConfig;
  onClose: () => void;
};

export default function ApiConfigSteps(props: {
  Component: React.FC<ComponentProps>;
  Trigger: React.FC;
}) {
  const [open, setOpen] = useState(false);

  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState(localStorage.getItem("api-key") || "");
  const [apiProxy, setApiProxy] = useState(
    localStorage.getItem("api-proxy") || ""
  );
  useEffect(() => {
    localStorage.setItem("api-key", apiKey);
  }, [apiKey]);
  useEffect(() => {
    localStorage.setItem("api-proxy", apiProxy);
  }, [apiProxy]);

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const toggleApiKeyVisibility = () => setApiKeyVisible(!apiKeyVisible);

  const steps = [
    <>
      <DialogHeader>
        <DialogTitle>填写 LLM API 信息</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              id="api-key"
              type={apiKeyVisible ? "text" : "password"}
              value={apiKey}
              onChange={(evt) => setApiKey(evt.currentTarget.value)}
            />
            <button
              type="button"
              onClick={toggleApiKeyVisibility}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={apiKeyVisible ? "Hide API Key" : "Show API Key"}
            >
              {apiKeyVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="proxy">Proxy (Optional)</Label>
          <Input
            className="mt-2"
            id="proxy"
            type="text"
            placeholder="http://proxyserver:port"
            value={apiProxy}
            onChange={(evt) => setApiProxy(evt.currentTarget.value)}
          />
        </div>
        <Button variant="default" onClick={() => setStep(1)}>
          下一步
        </Button>
      </div>
    </>,
    <props.Component
      apiConfig={{ apiKey, proxy: apiProxy }}
      onClose={() => setOpen(false)}
    />,
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{<props.Trigger />}</DialogTrigger>
      <DialogContent>{steps[step]}</DialogContent>
    </Dialog>
  );
}
