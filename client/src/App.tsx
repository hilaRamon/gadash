import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { dataCollections, trackingCollections } from './config/navigation'
import { CollectionPage } from './pages/CollectionPage'
import { CreateCustomerBillingPage } from './pages/CreateCustomerBillingPage'
import { EmployeeMonthlyReportPage } from './pages/EmployeeMonthlyReportPage'
import { HomePage } from './pages/HomePage'
import { MonthlySummaryPage } from './pages/MonthlySummaryPage'
import { SectionPage } from './pages/SectionPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
