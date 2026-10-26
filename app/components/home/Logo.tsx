import logoUrl from '~/assets/logo1.svg';

export default function Logo() {
  return (
    <span aria-label="Wake n Swag" className="ps2-logo-stack" role="img">
      <img
        alt=""
        aria-hidden="true"
        className="ps2-logo ps2-logo--base"
        src={logoUrl}
      />
      <img
        alt=""
        aria-hidden="true"
        className="ps2-logo ps2-logo--glow"
        src={logoUrl}
      />
    </span>
  );
}
