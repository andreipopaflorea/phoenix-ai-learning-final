
-- Create system_learning_courses table for course metadata
CREATE TABLE public.system_learning_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'book',
  course_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_learning_courses ENABLE ROW LEVEL SECURITY;

-- Everyone can view system courses
CREATE POLICY "Anyone can view system courses" 
ON public.system_learning_courses 
FOR SELECT 
USING (true);

-- Add columns to learning_units for system content
ALTER TABLE public.learning_units 
ADD COLUMN is_system_content BOOLEAN DEFAULT false,
ADD COLUMN course_id UUID REFERENCES public.system_learning_courses(id);

-- Make study_material_id nullable for system content
ALTER TABLE public.learning_units 
ALTER COLUMN study_material_id DROP NOT NULL;

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_unit_id UUID REFERENCES public.learning_units(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  hint TEXT,
  card_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Users can view flashcards for their learning units or system content
CREATE POLICY "Users can view flashcards for accessible units" 
ON public.flashcards 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.learning_units lu 
    WHERE lu.id = learning_unit_id 
    AND (lu.is_system_content = true OR lu.user_id = auth.uid())
  )
);

-- Update learning_units RLS to allow viewing system content
CREATE POLICY "Anyone can view system learning units" 
ON public.learning_units 
FOR SELECT 
USING (is_system_content = true);

-- Insert the 4 financial education courses
INSERT INTO public.system_learning_courses (id, title, description, icon, course_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Basic Financial Concepts', 'Master the fundamentals of finance including taxes, banking, interest rates, and more', 'landmark', 1),
('22222222-2222-2222-2222-222222222222', 'Startup Finance', 'Learn how startups raise money through the funding pyramid', 'rocket', 2),
('33333333-3333-3333-3333-333333333333', 'Capitalization Table', 'Understand equity ownership and different types of securities', 'table', 3),
('44444444-4444-4444-4444-444444444444', 'Income Statement', 'Learn to read and understand income statements', 'file-text', 4);

-- Insert learning units for Course 1: Basic Financial Concepts
INSERT INTO public.learning_units (id, user_id, unit_title, description, text, estimated_minutes, unit_order, is_system_content, course_id) VALUES
('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Taxes', 'Understanding how taxes work', 'Taxes are mandatory contributions to government revenue. They fund public services like roads, schools, and healthcare. Types include income tax (on earnings), sales tax (on purchases), and property tax (on real estate).', 5, 1, true, '11111111-1111-1111-1111-111111111111'),
('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Banks', 'How banks operate and their role', 'Banks are financial institutions that accept deposits, make loans, and provide financial services. They profit from the interest spread between loans and deposits. Key services include checking accounts, savings accounts, and credit.', 5, 2, true, '11111111-1111-1111-1111-111111111111'),
('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Interest', 'Simple vs compound interest', 'Interest is the cost of borrowing money. Simple interest is calculated on the principal only. Compound interest is calculated on principal plus accumulated interest, making it more powerful for savings and more expensive for loans.', 5, 3, true, '11111111-1111-1111-1111-111111111111'),
('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Investment', 'Basics of investing', 'Investment is putting money into assets with the expectation of generating returns. Key principles include diversification (spreading risk), time horizon (long-term vs short-term), and risk tolerance.', 5, 4, true, '11111111-1111-1111-1111-111111111111'),
('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Budgeting', 'Creating and managing budgets', 'Budgeting is tracking income and expenses to manage money effectively. The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings. Regular review helps identify spending patterns.', 5, 5, true, '11111111-1111-1111-1111-111111111111');

-- Insert learning units for Course 2: Startup Finance
INSERT INTO public.learning_units (id, user_id, unit_title, description, text, estimated_minutes, unit_order, is_system_content, course_id) VALUES
('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Friends & Family Round', 'First funding from personal network', 'The first level of startup funding typically comes from friends and family. This is usually the smallest round, ranging from $10K to $150K. It is based on personal relationships and trust rather than formal business metrics.', 5, 1, true, '22222222-2222-2222-2222-222222222222'),
('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Angel Investors', 'High-net-worth individual investors', 'Angel investors are wealthy individuals who invest their own money in early-stage startups. They typically invest $25K to $500K and often provide mentorship alongside capital. They take equity in exchange for investment.', 5, 2, true, '22222222-2222-2222-2222-222222222222'),
('b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Seed Funding', 'Early institutional investment', 'Seed funding is the first official equity funding stage. Typically $500K to $2M from seed funds or early-stage VCs. Used to prove product-market fit and build initial traction.', 5, 3, true, '22222222-2222-2222-2222-222222222222'),
('b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Series A', 'First major venture capital round', 'Series A is the first significant VC round, typically $2M to $15M. Requires proven business model and growth metrics. Investors expect detailed financial projections and clear path to profitability.', 5, 4, true, '22222222-2222-2222-2222-222222222222'),
('b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Series B and Beyond', 'Growth stage funding', 'Series B and later rounds focus on scaling. Series B typically $10M to $50M+. Used for expanding teams, entering new markets, and accelerating growth. Valuations are based on revenue multiples.', 5, 5, true, '22222222-2222-2222-2222-222222222222');

-- Insert learning units for Course 3: Capitalization Table
INSERT INTO public.learning_units (id, user_id, unit_title, description, text, estimated_minutes, unit_order, is_system_content, course_id) VALUES
('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Common Stock', 'Basic ownership shares', 'Common stock represents basic ownership in a company. Holders have voting rights and receive dividends after preferred shareholders. In liquidation, common stockholders are paid last.', 5, 1, true, '33333333-3333-3333-3333-333333333333'),
('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Preferred Stock', 'Senior equity with special rights', 'Preferred stock has priority over common stock for dividends and liquidation. Often used by investors for downside protection. May include conversion rights to common stock.', 5, 2, true, '33333333-3333-3333-3333-333333333333'),
('c3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Stock Options', 'Right to buy shares at fixed price', 'Stock options give the right (not obligation) to buy shares at a predetermined price. Common for employee compensation. Vest over time (typically 4 years) with a 1-year cliff.', 5, 3, true, '33333333-3333-3333-3333-333333333333'),
('c4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Warrants', 'Long-term purchase rights', 'Warrants are similar to options but typically longer-term and issued by the company. Often attached to other securities as a sweetener. Exercise price is usually set at issuance.', 5, 4, true, '33333333-3333-3333-3333-333333333333'),
('c5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Convertible Notes', 'Debt that converts to equity', 'Convertible notes are loans that convert to equity at a future financing round. Include a discount rate (typically 15-25%) and valuation cap. Popular for early-stage funding due to simplicity.', 5, 5, true, '33333333-3333-3333-3333-333333333333');

-- Insert learning units for Course 4: Income Statement
INSERT INTO public.learning_units (id, user_id, unit_title, description, text, estimated_minutes, unit_order, is_system_content, course_id) VALUES
('d1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Revenue', 'Top line income', 'Revenue (also called sales or top line) is the total income from business activities before any expenses. It includes all money earned from selling products or services.', 5, 1, true, '44444444-4444-4444-4444-444444444444'),
('d2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Cost of Goods Sold', 'Direct costs of production', 'COGS includes all direct costs to produce goods or services sold. For a manufacturer: raw materials, direct labor, factory overhead. Excludes indirect costs like marketing.', 5, 2, true, '44444444-4444-4444-4444-444444444444'),
('d3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Gross Profit', 'Revenue minus COGS', 'Gross profit = Revenue - COGS. Shows profitability of core business before operating expenses. Gross margin (gross profit / revenue) indicates pricing power and efficiency.', 5, 3, true, '44444444-4444-4444-4444-444444444444'),
('d4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Operating Expenses', 'Costs of running the business', 'Operating expenses include salaries, rent, marketing, R&D, and administrative costs. These are necessary to run the business but not directly tied to production.', 5, 4, true, '44444444-4444-4444-4444-444444444444'),
('d5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Net Income', 'Bottom line profit', 'Net income (bottom line) = Revenue - All Expenses - Taxes. Represents the actual profit available to shareholders. Can be positive (profit) or negative (loss).', 5, 5, true, '44444444-4444-4444-4444-444444444444');

-- Insert flashcards for basic financial concepts
INSERT INTO public.flashcards (learning_unit_id, question, answer, hint, card_order) VALUES
('a1111111-1111-1111-1111-111111111111', 'What are taxes?', 'Mandatory contributions to government revenue that fund public services', 'Think about roads and schools', 1),
('a1111111-1111-1111-1111-111111111111', 'Name three types of taxes', 'Income tax, sales tax, and property tax', 'Based on earnings, purchases, and ownership', 2),
('a2222222-2222-2222-2222-222222222222', 'How do banks make money?', 'From the interest spread between loans and deposits', 'They lend at higher rates than they pay', 1),
('a2222222-2222-2222-2222-222222222222', 'What services do banks provide?', 'Checking accounts, savings accounts, credit, and loans', 'Where you keep your money', 2),
('a3333333-3333-3333-3333-333333333333', 'What is simple interest?', 'Interest calculated only on the principal amount', 'The basic method', 1),
('a3333333-3333-3333-3333-333333333333', 'What is compound interest?', 'Interest calculated on principal plus accumulated interest', 'Interest on interest', 2),
('a4444444-4444-4444-4444-444444444444', 'What is diversification?', 'Spreading investments across different assets to reduce risk', 'Dont put all eggs in one basket', 1),
('a5555555-5555-5555-5555-555555555555', 'What is the 50/30/20 rule?', '50% needs, 30% wants, 20% savings', 'A budgeting guideline', 1);

-- Insert flashcards for startup finance
INSERT INTO public.flashcards (learning_unit_id, question, answer, hint, card_order) VALUES
('b1111111-1111-1111-1111-111111111111', 'How much is typically raised in Friends & Family round?', '$10K to $150K', 'The smallest round', 1),
('b2222222-2222-2222-2222-222222222222', 'What do angel investors provide besides money?', 'Mentorship and guidance', 'They share experience', 1),
('b3333333-3333-3333-3333-333333333333', 'What is seed funding used for?', 'To prove product-market fit and build initial traction', 'Planting the seed', 1),
('b4444444-4444-4444-4444-444444444444', 'What is required for Series A funding?', 'Proven business model and growth metrics', 'Show me the numbers', 1),
('b5555555-5555-5555-5555-555555555555', 'What are Series B funds used for?', 'Scaling: expanding teams, new markets, accelerating growth', 'Growing bigger', 1);

-- Insert flashcards for cap table
INSERT INTO public.flashcards (learning_unit_id, question, answer, hint, card_order) VALUES
('c1111111-1111-1111-1111-111111111111', 'Who gets paid last in liquidation?', 'Common stockholders', 'Basic ownership has basic priority', 1),
('c2222222-2222-2222-2222-222222222222', 'What priority does preferred stock have?', 'Priority over common stock for dividends and liquidation', 'Preferred means first', 1),
('c3333333-3333-3333-3333-333333333333', 'What is a typical vesting schedule for options?', '4 years with a 1-year cliff', 'Earn over time', 1),
('c4444444-4444-4444-4444-444444444444', 'How are warrants different from options?', 'Warrants are typically longer-term and issued by the company', 'Think long-term', 1),
('c5555555-5555-5555-5555-555555555555', 'What is a valuation cap?', 'Maximum valuation at which a convertible note converts to equity', 'A ceiling for conversion', 1);

-- Insert flashcards for income statement
INSERT INTO public.flashcards (learning_unit_id, question, answer, hint, card_order) VALUES
('d1111111-1111-1111-1111-111111111111', 'What is another name for revenue?', 'Sales or top line', 'Its at the top', 1),
('d2222222-2222-2222-2222-222222222222', 'What is included in COGS?', 'Raw materials, direct labor, and factory overhead', 'Direct production costs', 1),
('d3333333-3333-3333-3333-333333333333', 'How do you calculate gross profit?', 'Revenue minus Cost of Goods Sold', 'Subtract direct costs', 1),
('d4444444-4444-4444-4444-444444444444', 'Name examples of operating expenses', 'Salaries, rent, marketing, R&D, administrative costs', 'Running the business', 1),
('d5555555-5555-5555-5555-555555555555', 'What does net income represent?', 'Actual profit available to shareholders after all expenses and taxes', 'The bottom line', 1);
