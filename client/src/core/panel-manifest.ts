// Side-effect-only imports: every panel file calls
// moduleRegistry.registerPanelComponent(...) at module scope. Importing
// them all here — once, from DashboardPage — is what lets the Dashboard
// grid resolve a PanelDefinition's `component` string to a real component.
import '../components/modules/customers/CustomerListPanel';
import '../components/modules/customers/CustomerDetailPanel';
import '../components/modules/customers/NewCustomerPanel';
import '../components/modules/sales/OrdersPanel';
import '../components/modules/sales/NewOrderPanel';
import '../components/modules/sales/OrderDetailPanel';
import '../components/modules/sales/SalesAlertsPanel';
import '../components/modules/inventory/ProductListPanel';
import '../components/modules/inventory/StockAlertsPanel';
import '../components/modules/inventory/StockMovementPanel';
