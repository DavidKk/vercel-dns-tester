import BuildTime from './BuildTime'
import { getProjects, type VercelProject } from '@/app/actions/vercel'

export default async function Footer() {
  const projects = await getProjects()

  return (
    <footer className="mt-auto py-6 bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner">
      <div className="mx-auto flex flex-wrap justify-between items-center px-4 md:px-6 gap-x-4 gap-y-2">
        <div className="flex flex-wrap md:justify-start justify-center gap-x-4 gap-y-2 mx-auto md:ml-0">
          {projects.map((project: VercelProject) => (
            <a
              key={project.name}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {project.name}
            </a>
          ))}
        </div>

        <div className="mx-auto md:mr-0">
          <BuildTime />
        </div>
      </div>
    </footer>
  )
}
