import { StoreProvider, useStore } from './lib/store'
import { useHashRoute } from './lib/router'
import { Shell } from './components/Shell'
import { Login } from './pages/Login'
import { Jobs } from './pages/Jobs'
import { JobDetail } from './pages/JobDetail'
import { CompanyDetail, Companies } from './pages/Companies'
import { Applications } from './pages/Applications'
import { Notifications } from './pages/Notifications'
import { RegistrationDetail, RegistrationHome } from './pages/Registration'
import { RegistrationForm } from './pages/RegistrationForm'
import { DiaryHome } from './pages/Diary'
import { DiaryWeek } from './pages/DiaryWeek'
import { FinalPage } from './pages/Final'
import { Profile } from './pages/Profile'

function Router() {
  const { user } = useStore()
  const { raw, path, query } = useHashRoute()
  if (!user) return <Login />
  const [section, id] = path
  let page
  switch (section) {
    case 'companies':
      page = id ? <CompanyDetail id={id} /> : <Companies />
      break
    case 'applications':
      page = <Applications />
      break
    case 'registration':
      if (!id) page = <RegistrationHome />
      else if (id === 'new') page = <RegistrationForm key={raw} appId={query.get('app')} self={query.get('self') === '1'} />
      else if (path[2] === 'edit') page = <RegistrationForm key={raw} id={id} />
      else page = <RegistrationDetail id={id} />
      break
    case 'diary':
      page = id ? <DiaryWeek key={id} no={Number(id)} /> : <DiaryHome />
      break
    case 'final':
      page = <FinalPage />
      break
    case 'profile':
      page = <Profile />
      break
    case 'notifications':
      page = <Notifications />
      break
    default:
      page = id ? (
        <JobDetail id={id} />
      ) : (
        <Jobs key={raw} initialMajor={query.get('major') ?? ''} hint={query.get('hint') === '1'} />
      )
  }
  return <Shell active={section === 'notifications' ? '' : (section ?? 'jobs')}>{page}</Shell>
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  )
}
