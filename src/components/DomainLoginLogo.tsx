import LoginLogo from "../assets/LoginLogo.tsx"
import { getConnectxLogoSrc, getCurrentLoginBrand } from "../utils/loginBranding.ts"

interface DomainLoginLogoProps {
  className?: string
  connectxClassName?: string
  nexusVariant?: "landscape" | "square"
}

export const DomainLoginLogo = ({
  className = "",
  connectxClassName = "mx-auto w-full max-w-md h-auto object-contain",
  nexusVariant = "landscape",
}: DomainLoginLogoProps) => {
  const loginBrand = getCurrentLoginBrand()

  if (loginBrand === "connectx") {
    return (
      <img
        src={getConnectxLogoSrc()}
        alt="ConnectX"
        className={connectxClassName}
      />
    )
  }

  return (
    <div className={className}>
      <LoginLogo variant={nexusVariant} />
    </div>
  )
}
