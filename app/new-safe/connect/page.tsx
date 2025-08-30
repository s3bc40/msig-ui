import BtnBack from "@/app/components/BtnBackHistory";

export default function ConnectSafePage() {
  return (
    <div className="mx-auto flex min-h-full w-full flex-col items-center gap-6 p-10">
      <BtnBack />
      <div role="alert" className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <p>
          This feature is under development. Please use the Create Safe option
          for now.
        </p>
      </div>
    </div>
  );
}
