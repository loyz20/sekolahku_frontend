import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

function formatRangeStart(currentPage: number, pageSize: number, totalItems: number) {
  if (totalItems === 0) return 0;
  return (currentPage - 1) * pageSize + 1;
}

function formatRangeEnd(currentPage: number, pageSize: number, totalItems: number) {
  return Math.min(currentPage * pageSize, totalItems);
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  itemLabel = "data",
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationControlsProps) {
  const start = formatRangeStart(currentPage, pageSize, totalItems);
  const end = formatRangeEnd(currentPage, pageSize, totalItems);

  return (
    <div className={className ? className : "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Menampilkan {start}-{end} dari {totalItems} {itemLabel}
        </p>
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tampilkan</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per halaman</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          Sebelumnya
        </Button>
        <p className="text-sm text-muted-foreground">
          Halaman {currentPage} dari {totalPages}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
