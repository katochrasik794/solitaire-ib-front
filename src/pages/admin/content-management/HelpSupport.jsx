import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiHelpCircle, FiMessageCircle, FiGlobe, FiClock } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataTable from '../../../components/admin/DataTable';

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState('articles');
  const [editingItem, setEditingItem] = useState(null);

  // Mock support content data
  const articles = [
    {
      id: 1,
      title: 'Getting Started Guide',
      category: 'Getting Started',
      language: 'English',
      status: 'published',
      views: 1250,
      lastUpdated: '2024-03-15',
      author: 'Admin'
    },
    {
      id: 2,
      title: 'Commission Structure Explained',
      category: 'Commissions',
      language: 'English',
      status: 'published',
      views: 890,
      lastUpdated: '2024-03-10',
      author: 'Admin'
    },
    {
      id: 3,
      title: 'Troubleshooting Login Issues',
      category: 'Technical',
      language: 'English',
      status: 'draft',
      views: 0,
      lastUpdated: '2024-03-20',
      author: 'Admin'
    }
  ];

  const faqs = [
    {
      id: 1,
      question: 'How do I calculate my commission?',
      category: 'Commissions',
      language: 'English',
      status: 'published',
      views: 2100,
      lastUpdated: '2024-03-12',
      author: 'Admin'
    },
    {
      id: 2,
      question: 'What is the minimum withdrawal amount?',
      category: 'Payments',
      language: 'English',
      status: 'published',
      views: 1850,
      lastUpdated: '2024-03-08',
      author: 'Admin'
    },
    {
      id: 3,
      question: 'How to reset my password?',
      category: 'Account',
      language: 'English',
      status: 'published',
      views: 1200,
      lastUpdated: '2024-03-05',
      author: 'Admin'
    }
  ];

  const tickets = [
    {
      id: 1,
      subject: 'Commission calculation issue',
      category: 'Technical',
      priority: 'high',
      status: 'open',
      createdDate: '2024-03-20',
      lastActivity: '2024-03-20',
      assignee: 'Support Team'
    },
    {
      id: 2,
      subject: 'Account verification request',
      category: 'Account',
      priority: 'medium',
      status: 'in_progress',
      createdDate: '2024-03-19',
      lastActivity: '2024-03-20',
      assignee: 'Admin'
    },
    {
      id: 3,
      subject: 'Payment method inquiry',
      category: 'Payments',
      priority: 'low',
      status: 'resolved',
      createdDate: '2024-03-18',
      lastActivity: '2024-03-19',
      assignee: 'Support Team'
    }
  ];

  const getColumns = (type) => {
    const baseColumns = [
      {
        key: 'title',
        label: type === 'faqs' ? 'Question' : 'Title',
        sortable: true,
        render: (item) => (
          <div>
            <div className="font-medium text-gray-900">{item.title || item.question}</div>
            <div className="text-sm text-gray-500">{item.category}</div>
          </div>
        )
      },
      {
        key: 'language',
        label: 'Language',
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-1">
            <FiGlobe className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{item.language}</span>
          </div>
        )
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true
      },
      {
        key: 'views',
        label: 'Views',
        sortable: true,
        render: (item) => (
          <span className="font-medium">{item.views.toLocaleString()}</span>
        )
      },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        sortable: true,
        render: (item) => (
          <div className="flex items-center gap-1">
            <FiClock className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{item.lastUpdated}</span>
          </div>
        )
      }
    ];

    if (type === 'tickets') {
      return [
        {
          key: 'subject',
          label: 'Subject',
          sortable: true,
          render: (ticket) => (
            <div>
              <div className="font-medium text-gray-900">{ticket.subject}</div>
              <div className="text-sm text-gray-500">{ticket.category}</div>
            </div>
          )
        },
        {
          key: 'priority',
          label: 'Priority',
          sortable: true,
          render: (ticket) => (
            <StatusBadge
              status={ticket.priority}
              size="sm"
            />
          )
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true
        },
        {
          key: 'assignee',
          label: 'Assignee',
          sortable: true
        },
        {
          key: 'createdDate',
          label: 'Created',
          sortable: true
        }
      ];
    }

    return baseColumns;
  };

  const getData = () => {
    switch (activeTab) {
      case 'articles': return articles;
      case 'faqs': return faqs;
      case 'tickets': return tickets;
      default: return [];
    }
  };

  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const openTickets = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help Support</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage help articles, FAQs, and support tickets</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<FiPlus className="h-4 w-4" />}
        >
          <span className="hidden sm:inline">Add Content</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">{totalArticles}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiHelpCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{publishedArticles}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiMessageCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
              <FiGlobe className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{openTickets}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Tabs */}
      <AdminCard>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'articles', label: 'Help Articles' },
              { id: 'faqs', label: 'FAQs' },
              { id: 'tickets', label: 'Support Tickets' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </AdminCard>

      {/* Content Table */}
      <AdminCard>
        <DataTable
          data={getData()}
          columns={getColumns(activeTab)}
          searchable={true}
          filterable={true}
          emptyMessage={`No ${activeTab} found`}
        />
      </AdminCard>

      {/* Content Categories */}
      <AdminCard header="Content Categories" icon={<FiHelpCircle className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Getting Started', 'Commissions', 'Payments', 'Technical', 'Account'].map(category => (
            <div key={category} className="p-4 bg-gray-50 rounded-lg text-center">
              <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
              <p className="text-sm text-gray-600">
                {articles.filter(a => a.category === category).length} articles
              </p>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Support Statistics */}
      <AdminCard header="Support Statistics" icon={<FiMessageCircle className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Response Time</h4>
            <p className="text-sm text-blue-700">
              Average response time: 2.5 hours<br />
              Target response time: 4 hours
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Resolution Rate</h4>
            <p className="text-sm text-green-700">
              Tickets resolved: 95%<br />
              Customer satisfaction: 4.8/5
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

export default HelpSupport;
