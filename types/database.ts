/**
 * Cross-checked field-by-field against the real `generate_typescript_types`
 * output from the live project (Phase 2 migrations 0001-0016 applied,
 * 2026-09-12) -- every table/column/relationship matches. Kept
 * hand-authored rather than replaced wholesale with the raw generator
 * output for two deliberate reasons the generator can't express:
 *   1. `Insert`/`Update` are `never` on orders/order_items/
 *      order_status_history/payments/loyalty_accounts/
 *      loyalty_transactions -- these are only ever written via the
 *      trusted RPC functions (DATABASE.md, "Trusted Mutation Functions"),
 *      and this is a compile-time guard against accidentally writing a
 *      direct .insert()/.update() call against them.
 *   2. Status/type/role columns use string-literal unions (OrderStatus,
 *      PaymentStatus, etc.) instead of the generic `string` the generator
 *      produces, since it doesn't parse CHECK constraints.
 * Regenerate and re-diff after any future schema change (`mcp__supabase__
 * generate_typescript_types` or `supabase gen types`), reapplying both
 * customizations above.
 *
 * Every table includes `Relationships: []` even where empty:
 * @supabase/postgrest-js's `GenericTable` type requires that field to
 * structurally match `GenericSchema`, and omitting it silently breaks
 * type inference for insert/update/rpc calls project-wide (everything
 * resolves to `never`) while `select()` queries still look fine -- exactly
 * the failure mode this caused before it was added. Row/Insert/Update are
 * each independent, fully-inline object types (not derived from each
 * other via indexed access) to avoid a separate self-reference pitfall.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "PACKING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "AWAITING_VERIFICATION" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentAttemptStatus = "PENDING" | "AWAITING_VERIFICATION" | "VERIFIED" | "REJECTED" | "REFUNDED";

export type LoyaltyTransactionType = "EARNED" | "REDEEMED" | "ADJUSTED" | "REVERSED";

export type LoyaltyTransactionStatus = "PENDING" | "AVAILABLE" | "CANCELLED";

export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export type ProductType = "standard" | "box";

export type ProfileRole = "customer" | "admin";

export interface Database {
  // Lets createClient<Database>(...) auto-detect the PostgREST wire
  // version instead of needing a second explicit type parameter.
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          slug: string;
          name_ar: string;
          name_en: string | null;
          description_ar: string | null;
          description_en: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          meta_title_ar: string | null;
          meta_title_en: string | null;
          meta_description_ar: string | null;
          meta_description_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          slug: string;
          name_ar: string;
          name_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          meta_title_ar?: string | null;
          meta_title_en?: string | null;
          meta_description_ar?: string | null;
          meta_description_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          slug?: string;
          name_ar?: string;
          name_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          meta_title_ar?: string | null;
          meta_title_en?: string | null;
          meta_description_ar?: string | null;
          meta_description_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "categories_parent_id_fkey", columns: ["parent_id"], isOneToOne: false, referencedRelation: "categories", referencedColumns: ["id"] }
        ];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          product_type: ProductType;
          sku: string | null;
          slug: string;
          name_ar: string;
          name_en: string | null;
          description_ar: string | null;
          description_en: string | null;
          unit_label_ar: string | null;
          unit_label_en: string | null;
          price: number;
          is_available: boolean;
          requires_reservation: boolean;
          is_featured: boolean;
          display_order: number;
          meta_title_ar: string | null;
          meta_title_en: string | null;
          meta_description_ar: string | null;
          meta_description_en: string | null;
          search_text_normalized: string;
          search_vector: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          product_type?: ProductType;
          sku?: string | null;
          slug: string;
          name_ar: string;
          name_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          unit_label_ar?: string | null;
          unit_label_en?: string | null;
          price: number;
          is_available?: boolean;
          requires_reservation?: boolean;
          is_featured?: boolean;
          display_order?: number;
          meta_title_ar?: string | null;
          meta_title_en?: string | null;
          meta_description_ar?: string | null;
          meta_description_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          product_type?: ProductType;
          sku?: string | null;
          slug?: string;
          name_ar?: string;
          name_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          unit_label_ar?: string | null;
          unit_label_en?: string | null;
          price?: number;
          is_available?: boolean;
          requires_reservation?: boolean;
          is_featured?: boolean;
          display_order?: number;
          meta_title_ar?: string | null;
          meta_title_en?: string | null;
          meta_description_ar?: string | null;
          meta_description_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "products_category_id_fkey", columns: ["category_id"], isOneToOne: false, referencedRelation: "categories", referencedColumns: ["id"] }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_ar: string | null;
          alt_en: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_ar?: string | null;
          alt_en?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt_ar?: string | null;
          alt_en?: string | null;
          display_order?: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "product_images_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"] }
        ];
      };
      box_items: {
        Row: {
          id: string;
          box_product_id: string;
          item_product_id: string;
          quantity: number;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          box_product_id: string;
          item_product_id: string;
          quantity?: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          box_product_id?: string;
          item_product_id?: string;
          quantity?: number;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "box_items_box_product_id_fkey", columns: ["box_product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"] },
          { foreignKeyName: "box_items_item_product_id_fkey", columns: ["item_product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"] }
        ];
      };
      delivery_zones: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          is_active: boolean;
          display_order: number;
          delivery_fee: number | null;
          min_order_amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          is_active?: boolean;
          display_order?: number;
          delivery_fee?: number | null;
          min_order_amount?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string | null;
          is_active?: boolean;
          display_order?: number;
          delivery_fee?: number | null;
          min_order_amount?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_areas: {
        Row: {
          id: string;
          delivery_zone_id: string;
          governorate: string;
          city: string;
          area: string;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          delivery_zone_id: string;
          governorate: string;
          city: string;
          area: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          delivery_zone_id?: string;
          governorate?: string;
          city?: string;
          area?: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "delivery_areas_delivery_zone_id_fkey", columns: ["delivery_zone_id"], isOneToOne: false, referencedRelation: "delivery_zones", referencedColumns: ["id"] }
        ];
      };
      delivery_time_slots: {
        Row: {
          id: string;
          label_ar: string;
          label_en: string | null;
          start_time: string;
          end_time: string;
          display_order: number;
          is_active: boolean;
          max_orders: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label_ar: string;
          label_en?: string | null;
          start_time: string;
          end_time: string;
          display_order?: number;
          is_active?: boolean;
          max_orders?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label_ar?: string;
          label_en?: string | null;
          start_time?: string;
          end_time?: string;
          display_order?: number;
          is_active?: boolean;
          max_orders?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string | null;
          recipient_name: string;
          phone: string;
          delivery_area_id: string;
          detailed_address: string;
          landmark: string | null;
          notes: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          label?: string | null;
          recipient_name: string;
          phone: string;
          delivery_area_id: string;
          detailed_address: string;
          landmark?: string | null;
          notes?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          label?: string | null;
          recipient_name?: string;
          phone?: string;
          delivery_area_id?: string;
          detailed_address?: string;
          landmark?: string | null;
          notes?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "addresses_profile_id_fkey", columns: ["profile_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] },
          { foreignKeyName: "addresses_delivery_area_id_fkey", columns: ["delivery_area_id"], isOneToOne: false, referencedRelation: "delivery_areas", referencedColumns: ["id"] }
        ];
      };
      carts: {
        Row: {
          id: string;
          profile_id: string | null;
          status: "active" | "converted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          status?: "active" | "converted";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          status?: "active" | "converted";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "carts_profile_id_fkey", columns: ["profile_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "cart_items_cart_id_fkey", columns: ["cart_id"], isOneToOne: false, referencedRelation: "carts", referencedColumns: ["id"] },
          { foreignKeyName: "cart_items_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"] }
        ];
      };
      payment_methods: {
        Row: {
          id: string;
          code: string;
          name_ar: string;
          name_en: string | null;
          instructions_ar: string | null;
          instructions_en: string | null;
          account_details: Json;
          requires_proof: boolean;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_ar: string;
          name_en?: string | null;
          instructions_ar?: string | null;
          instructions_en?: string | null;
          account_details?: Json;
          requires_proof?: boolean;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_ar?: string;
          name_en?: string | null;
          instructions_ar?: string | null;
          instructions_en?: string | null;
          account_details?: Json;
          requires_proof?: boolean;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          status: SubscriptionStatus;
          address_id: string | null;
          delivery_zone_id: string | null;
          delivery_time_slot_id: string | null;
          payment_method_id: string | null;
          day_of_week: number | null;
          start_date: string | null;
          next_delivery_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          status?: SubscriptionStatus;
          address_id?: string | null;
          delivery_zone_id?: string | null;
          delivery_time_slot_id?: string | null;
          payment_method_id?: string | null;
          day_of_week?: number | null;
          start_date?: string | null;
          next_delivery_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          status?: SubscriptionStatus;
          address_id?: string | null;
          delivery_zone_id?: string | null;
          delivery_time_slot_id?: string | null;
          payment_method_id?: string | null;
          day_of_week?: number | null;
          start_date?: string | null;
          next_delivery_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "subscriptions_profile_id_fkey", columns: ["profile_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] },
          { foreignKeyName: "subscriptions_address_id_fkey", columns: ["address_id"], isOneToOne: false, referencedRelation: "addresses", referencedColumns: ["id"] },
          { foreignKeyName: "subscriptions_delivery_zone_id_fkey", columns: ["delivery_zone_id"], isOneToOne: false, referencedRelation: "delivery_zones", referencedColumns: ["id"] },
          { foreignKeyName: "subscriptions_delivery_time_slot_id_fkey", columns: ["delivery_time_slot_id"], isOneToOne: false, referencedRelation: "delivery_time_slots", referencedColumns: ["id"] },
          { foreignKeyName: "subscriptions_payment_method_id_fkey", columns: ["payment_method_id"], isOneToOne: false, referencedRelation: "payment_methods", referencedColumns: ["id"] }
        ];
      };
      subscription_items: {
        Row: {
          id: string;
          subscription_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "subscription_items_subscription_id_fkey", columns: ["subscription_id"], isOneToOne: false, referencedRelation: "subscriptions", referencedColumns: ["id"] },
          { foreignKeyName: "subscription_items_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"] }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          profile_id: string;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          discount_amount: number;
          total: number;
          address_id: string | null;
          address_snapshot: Json;
          delivery_zone_id: string | null;
          delivery_time_slot_id: string | null;
          delivery_slot_snapshot: Json;
          delivery_date: string;
          payment_method_id: string | null;
          payment_status: PaymentStatus;
          subscription_id: string | null;
          customer_notes: string | null;
          loyalty_points_earned: number;
          loyalty_points_redeemed: number;
          created_at: string;
          updated_at: string;
        };
        // No Insert/Update on purpose: orders are only ever written via
        // the create_order()/update_order_status() RPCs. See
        // DATABASE.md, Trusted Mutation Functions.
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "orders_profile_id_fkey", columns: ["profile_id"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] },
          { foreignKeyName: "orders_address_id_fkey", columns: ["address_id"], isOneToOne: false, referencedRelation: "addresses", referencedColumns: ["id"] },
          { foreignKeyName: "orders_delivery_zone_id_fkey", columns: ["delivery_zone_id"], isOneToOne: false, referencedRelation: "delivery_zones", referencedColumns: ["id"] },
          { foreignKeyName: "orders_delivery_time_slot_id_fkey", columns: ["delivery_time_slot_id"], isOneToOne: false, referencedRelation: "delivery_time_slots", referencedColumns: ["id"] },
          { foreignKeyName: "orders_payment_method_id_fkey", columns: ["payment_method_id"], isOneToOne: false, referencedRelation: "payment_methods", referencedColumns: ["id"] },
          { foreignKeyName: "orders_subscription_id_fkey", columns: ["subscription_id"], isOneToOne: false, referencedRelation: "subscriptions", referencedColumns: ["id"] }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_ar: string;
          product_name_en: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          notes: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"] },
          { foreignKeyName: "order_items_product_id_fkey", columns: ["product_id"], isOneToOne: false, referencedRelation: "products", referencedColumns: ["id"] }
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "order_status_history_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"] },
          { foreignKeyName: "order_status_history_changed_by_fkey", columns: ["changed_by"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method_id: string;
          amount: number;
          status: PaymentAttemptStatus;
          transaction_reference: string | null;
          proof_image_url: string | null;
          verified_by: string | null;
          verified_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "payments_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"] },
          { foreignKeyName: "payments_payment_method_id_fkey", columns: ["payment_method_id"], isOneToOne: false, referencedRelation: "payment_methods", referencedColumns: ["id"] },
          { foreignKeyName: "payments_verified_by_fkey", columns: ["verified_by"], isOneToOne: false, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      loyalty_settings: {
        Row: {
          id: 1;
          is_enabled: boolean;
          spend_threshold: number;
          points_per_threshold: number;
          points_redemption_value: number;
          redemption_points_unit: number;
          min_redeemable_points: number | null;
          updated_at: string;
        };
        Insert: {
          id?: 1;
          is_enabled?: boolean;
          spend_threshold?: number;
          points_per_threshold?: number;
          points_redemption_value?: number;
          redemption_points_unit?: number;
          min_redeemable_points?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: 1;
          is_enabled?: boolean;
          spend_threshold?: number;
          points_per_threshold?: number;
          points_redemption_value?: number;
          redemption_points_unit?: number;
          min_redeemable_points?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      loyalty_accounts: {
        Row: {
          id: string;
          profile_id: string;
          points_balance: number;
          pending_points_balance: number;
          lifetime_points_earned: number;
          lifetime_points_redeemed: number;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "loyalty_accounts_profile_id_fkey", columns: ["profile_id"], isOneToOne: true, referencedRelation: "profiles", referencedColumns: ["id"] }
        ];
      };
      loyalty_transactions: {
        Row: {
          id: string;
          loyalty_account_id: string;
          type: LoyaltyTransactionType;
          status: LoyaltyTransactionStatus;
          points: number;
          balance_after: number;
          order_id: string | null;
          reason: string | null;
          created_at: string;
          available_at: string | null;
          cancelled_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "loyalty_transactions_loyalty_account_id_fkey", columns: ["loyalty_account_id"], isOneToOne: false, referencedRelation: "loyalty_accounts", referencedColumns: ["id"] },
          { foreignKeyName: "loyalty_transactions_order_id_fkey", columns: ["order_id"], isOneToOne: false, referencedRelation: "orders", referencedColumns: ["id"] }
        ];
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title_ar: string | null;
          title_en: string | null;
          image_url: string | null;
          link_url: string | null;
          display_order: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_ar?: string | null;
          title_en?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title_ar?: string | null;
          title_en?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      normalize_arabic: {
        Args: { input: string };
        Returns: string;
      };
      search_products: {
        Args: { p_query: string; p_category_id?: string | null; p_limit?: number; p_offset?: number };
        Returns: Database["public"]["Tables"]["products"]["Row"][];
      };
      count_search_products: {
        Args: { p_query: string; p_category_id?: string | null };
        Returns: number;
      };
      search_suggestions: {
        Args: { p_query: string; p_limit?: number };
        Returns: { id: string; slug: string; name_ar: string; name_en: string | null; kind: string }[];
      };
      create_order: {
        Args: {
          p_cart_id: string;
          p_address_id: string;
          p_delivery_time_slot_id: string;
          p_payment_method_id: string;
          p_customer_notes?: string | null;
          p_redeem_points?: number | null;
          p_delivery_date: string;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      update_order_status: {
        Args: {
          p_order_id: string;
          p_new_status: OrderStatus;
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      record_payment_verification: {
        Args: {
          p_payment_id: string;
          p_new_status: PaymentAttemptStatus;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
      admin_generate_subscription_order: {
        Args: { p_subscription_id: string };
        Returns: { order_id: string | null; outcome: string; reason: string | null }[];
      };
      admin_set_subscription_status: {
        Args: { p_subscription_id: string; p_status: SubscriptionStatus };
        Returns: Database["public"]["Tables"]["subscriptions"]["Row"];
      };
      admin_adjust_loyalty_points: {
        Args: { p_profile_id: string; p_points: number; p_reason: string };
        Returns: Database["public"]["Tables"]["loyalty_accounts"]["Row"];
      };
      admin_set_profile_role: {
        Args: { p_profile_id: string; p_new_role: ProfileRole };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      admin_set_box_contents: {
        Args: { p_box_product_id: string; p_items: { productId: string; quantity: number }[] };
        Returns: void;
      };
      admin_set_primary_product_image: {
        Args: { p_product_id: string; p_image_id: string };
        Returns: void;
      };
      cancel_own_order: {
        Args: { p_order_id: string };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
