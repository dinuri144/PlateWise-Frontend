
import { Leaf } from "lucide-react";

type PageHeaderProps = {
    title: string;
    description: string;
};

export default function PageHeader({
    title,
    description,
}: PageHeaderProps) {
    return (
        <div className="mb-8">
            {/* PlateWise Branding */}
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                    <Leaf size={23} strokeWidth={2.5} />
                </div>

                <div>
                    <h1 className="text-xl font-black tracking-tight">
                        <span className="text-slate-900">Plate</span>
                        <span className="text-emerald-600">Wise</span>
                    </h1>

                    <p className="text-[11px] font-medium text-slate-500">
                        Smart nutrition, made simple
                    </p>
                </div>
            </div>

            {/* Page-specific Heading */}
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
                {description}
            </p>
        </div>
    );
}
