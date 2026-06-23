import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute'
import { dataCollections, trackingCollections } from './config/navigation'
import { CollectionPage } from './pages/CollectionPage'
import { CreateCustomerBillingPage } from './pages/CreateCustomerBillingPage'
import { EmployeeAdminPage } from './pages/employee/EmployeeAdminPage'
import { EmployeeFieldWorkPage } from './pages/employee/EmployeeFieldWorkPage'
import { EmployeeFuelPage } from './pages/employee/EmployeeFuelPage'
import { EmployeeHomePage } from './pages/employee/EmployeeHomePage'
import { EmployeeLayout } from './pages/employee/EmployeeLayout'
import { EmployeeMaterialPage } from './pages/employee/EmployeeMaterialPage'
import { EmployeeMonthlyReportPage } from './pages/EmployeeMonthlyReportPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MonthlySummaryPage } from './pages/MonthlySummaryPage'
import { SectionPage } from './pages/SectionPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute role="employee" />}>
          <Route path="employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeHomePage />} />
            <Route path="field-work" element={<EmployeeFieldWorkPage />} />
            <Route path="admin" element={<EmployeeAdminPage />} />
            <Route path="material" element={<EmployeeMaterialPage />} />
            <Route path="fuel" element={<EmployeeFuelPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            {dataCollections.map((item) => (
              <Route
                key={item.id}
                path={item.path.replace(/^\//, '')}
                element={<CollectionPage collectionId={item.id} />}
              />
            ))}
            {trackingCollections.map((item) => (
              <Route
                key={item.id}
                path={item.path.replace(/^\//, '')}
                element={<CollectionPage collectionId={item.id} />}
              />
            ))}
            <Route
              path="trackings/customer-billing/new"
              element={<CreateCustomerBillingPage />}
            />
            <Route
              path="reports/employee-monthly"
              element={<EmployeeMonthlyReportPage />}
            />
            <Route
              path="reports/monthly-summary"
              element={<MonthlySummaryPage />}
            />
            <Route path="trackings" element={<SectionPage title="מעקבים" />} />
            <Route path="reports" element={<SectionPage title="דוחות" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
