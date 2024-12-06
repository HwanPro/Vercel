-- CreateTable
CREATE TABLE "UserAccount" (
    "user_id" SERIAL NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_username" TEXT NOT NULL,
    "user_passphrase" TEXT NOT NULL,
    "user_role" TEXT NOT NULL DEFAULT 'client',
    "user_2fa_secret" TEXT,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "membership_id" SERIAL NOT NULL,
    "membership_type" TEXT NOT NULL,
    "membership_cost" DOUBLE PRECISION NOT NULL,
    "membership_features" TEXT[],
    "membership_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "membership_duration" INTEGER NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_description" TEXT NOT NULL,
    "item_price" DOUBLE PRECISION NOT NULL,
    "item_discount" DOUBLE PRECISION,
    "item_stock" INTEGER NOT NULL,
    "item_image_url" TEXT NOT NULL,
    "item_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "payment_id" SERIAL NOT NULL,
    "payer_user_id" INTEGER NOT NULL,
    "payment_amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "UserContact" (
    "contact_id" SERIAL NOT NULL,
    "contact_user_id" INTEGER,
    "contact_message" TEXT NOT NULL,
    "contact_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserContact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "ClientProfile" (
    "profile_id" TEXT NOT NULL,
    "profile_first_name" TEXT NOT NULL,
    "profile_last_name" TEXT NOT NULL,
    "profile_plan" TEXT NOT NULL,
    "profile_start_date" TIMESTAMP(3) NOT NULL,
    "profile_end_date" TIMESTAMP(3) NOT NULL,
    "profile_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_emergency_phone" TEXT NOT NULL,
    "profile_phone" TEXT NOT NULL,
    "profile_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "_UserMemberships" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserMemberships_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_user_email_key" ON "UserAccount"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_user_username_key" ON "UserAccount"("user_username");

-- CreateIndex
CREATE INDEX "_UserMemberships_B_index" ON "_UserMemberships"("B");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "UserAccount"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContact" ADD CONSTRAINT "UserContact_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "UserAccount"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserMemberships" ADD CONSTRAINT "_UserMemberships_A_fkey" FOREIGN KEY ("A") REFERENCES "MembershipPlan"("membership_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserMemberships" ADD CONSTRAINT "_UserMemberships_B_fkey" FOREIGN KEY ("B") REFERENCES "UserAccount"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
