import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CartDropdown() {
  const { t } = useTranslation();
  const { items, removeItem, totalPrice } = useCart();
  const cartCount = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-border/40 hover:bg-muted transition-colors"
          aria-label="Shopping cart"
        >
          <ShoppingCart className="w-5 h-5 text-foreground" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 border-border/40">
        <div className="max-h-96 overflow-y-auto">
          {cartCount === 0 ? (
            <div className="p-6 text-center space-y-4">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link to="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="divide-y divide-border/40">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        #{item.companyNumber}
                      </p>
                      <p className="text-sm font-bold text-primary mt-2">
                        £{item.price.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-destructive/10 rounded text-destructive transition-colors flex-shrink-0"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="bg-muted/30 p-4 border-t border-border/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-lg font-bold text-primary">
                    £{totalPrice.toLocaleString()}
                  </span>
                </div>

                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary-600 text-white gap-2"
                  asChild
                >
                  <Link to="/cart">
                    View Cart
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link to="/">Continue Shopping</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
