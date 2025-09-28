'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function CoursesPage() {
  // Mock data - will be replaced with real data from API
  const courses = [
    {
      id: '1',
      title: 'Introduction to Machine Learning',
      description: 'A comprehensive guide to machine learning fundamentals and practical applications.',
      status: 'Published',
      visibility: 'Public',
      students: 456,
      progress: 100,
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      title: 'Web Development Bootcamp',
      description: 'Learn full-stack web development from HTML/CSS to React and Node.js.',
      status: 'In Progress',
      visibility: 'Private',
      students: 234,
      progress: 75,
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-22',
    },
    {
      id: '3',
      title: 'Data Science Fundamentals',
      description: 'Master data analysis, visualization, and statistical methods.',
      status: 'Draft',
      visibility: 'Private',
      students: 0,
      progress: 40,
      thumbnail: '/api/placeholder/300/200',
      createdAt: '2024-01-22',
      updatedAt: '2024-01-22',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'default'
      case 'In Progress':
        return 'secondary'
      case 'Draft':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Create and manage your AI-powered courses
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.filter(c => c.status === 'Published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((sum, course) => sum + course.students, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search courses..." className="pl-10" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Course Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="group hover:shadow-md transition-shadow">
            <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/courses/${course.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/courses/${course.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <Badge variant={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {course.students} students
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Updated {course.updatedAt}</span>
                <Badge variant="outline" className="text-xs">
                  {course.visibility}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Course Card */}
        <Card className="group cursor-pointer hover:shadow-md transition-shadow border-dashed">
          <Link href="/dashboard/courses/new">
            <div className="aspect-video w-full flex items-center justify-center rounded-t-lg bg-muted/50">
              <Plus className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Create New Course</CardTitle>
              <CardDescription>
                Start building your next course with AI assistance
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Empty State (when no courses) */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first course to get started with AI-powered content creation.
          </p>
          <Button asChild>
            <Link href="/dashboard/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Course
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}