import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  DollarSign,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import Table from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Modal from '../../components/modals/Modal';

export function CustomerPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [lastCommittedRecord, setLastCommittedRecord] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      accountType: 'CHECKING',
      initialDeposit: 1500,
      currency: 'USD',
    },
  });

  const fetchCustomers = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await customerService.getCustomers({ page, limit: 10 });
      setCustomers(response.data);
      setPagination(response.pagination);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleTransactionSubmit = async (data) => {
    try {
      const payload = {
        customer: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          status: 'ACTIVE',
        },
        account: {
          accountType: data.accountType,
          initialDeposit: Number(data.initialDeposit),
          currency: data.currency,
        },
      };

      const response = await customerService.createTransactionDemo(payload);
      setLastCommittedRecord(response.data);
      toast.success('ACID Transaction successfully committed!');
      setDemoModalOpen(false);
      reset();
      fetchCustomers(1);
    } catch (err) {
      toast.error(err.message || 'Transaction aborted & rolled back');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'customer',
        title: 'Customer Details',
        render: (_, row) => (
          <div>
            <div className="font-semibold text-slate-900">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        ),
      },
      {
        key: 'company',
        title: 'Company',
        render: (val) => val || '—',
      },
      {
        key: 'accounts',
        title: 'Primary Account',
        render: (_, row) => {
          const acc = row.accounts?.[0];
          if (!acc) return <span className="text-slate-400 text-xs">No account</span>;
          return (
            <div>
              <div className="font-mono text-xs font-semibold text-slate-800">{acc.accountNumber}</div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {formatCurrency(acc.balance, acc.currency)} ({acc.accountType})
              </div>
            </div>
          );
        },
      },
      {
        key: 'status',
        title: 'Status',
        render: (status) => <span className="badge-active">{status}</span>,
      },
      {
        key: 'createdAt',
        title: 'Enrolled Date',
        render: (val) => <span className="text-xs text-slate-500">{formatDate(val)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Transaction Showcase Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white shadow-lg border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              ACID Transaction Showcase (Topic 11 & 24)
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Atomic Multi-Entity Database Transactions
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every operation executes within a strict managed Sequelize transaction:
              <br />
              <code className="text-emerald-400 text-xs font-mono">
                Create Customer ➔ Create Account ➔ Record Audit Log ➔ Commit ➔ BullMQ Notification
              </code>
              <br />
              If any operation fails, the database automatically performs a clean rollback with zero orphaned data.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            leftIcon={Plus}
            onClick={() => setDemoModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-lg shadow-emerald-900/30 border-0"
          >
            Execute Transaction
          </Button>
        </div>
      </div>

      {/* Last Transaction Result Banner */}
      {lastCommittedRecord && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Transaction Successfully Committed:</span> Created customer{' '}
            <span className="font-semibold">
              {lastCommittedRecord.customer?.firstName} {lastCommittedRecord.customer?.lastName}
            </span>{' '}
            with Account{' '}
            <span className="font-mono font-semibold">
              {lastCommittedRecord.account?.accountNumber}
            </span>{' '}
            and initial deposit of{' '}
            <span className="font-semibold">
              {formatCurrency(lastCommittedRecord.account?.balance, lastCommittedRecord.account?.currency)}
            </span>
            . Audit trail and background notification dispatched!
          </div>
        </div>
      )}

      {/* Customers Table Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Enrolled Customers & Accounts</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized directly with the relational database layer
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={RefreshCw}
          onClick={() => fetchCustomers(pagination.page)}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="space-y-3">
        <Table
          columns={columns}
          data={customers}
          isLoading={isLoading}
          emptyTitle="No customers yet"
          emptyDescription="Click 'Execute Transaction' above to create your first customer and account atomically."
        />

        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={(p) => fetchCustomers(p)}
        />
      </div>

      {/* Execute Transaction Modal */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Execute Multi-Step ACID Transaction"
        description="This will test database atomicity across Customers, Accounts, and AuditLogs."
      >
        <form onSubmit={handleSubmit(handleTransactionSubmit)} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
              1. Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Eleanor"
                required
                error={errors.firstName?.message}
                {...register('firstName', { required: 'First name is required' })}
              />
              <Input
                label="Last Name"
                placeholder="Vance"
                required
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Last name is required' })}
              />
            </div>

            <div className="mt-2.5">
              <Input
                label="Email"
                type="email"
                placeholder="eleanor.vance@company.com"
                required
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2.5">
              <Input
                label="Phone"
                placeholder="+1-555-0248"
                required
                error={errors.phone?.message}
                {...register('phone', { required: 'Phone is required' })}
              />
              <Input
                label="Company"
                placeholder="Vance Logistics"
                {...register('company')}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">
              2. Financial Account Creation
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Account Type"
                options={[
                  { value: 'CHECKING', label: 'Checking Account' },
                  { value: 'SAVINGS', label: 'Savings Account' },
                  { value: 'CREDIT', label: 'Line of Credit' },
                ]}
                {...register('accountType')}
              />
              <Input
                label="Initial Deposit ($)"
                type="number"
                step="0.01"
                required
                error={errors.initialDeposit?.message}
                {...register('initialDeposit', { required: 'Deposit amount required', min: 0 })}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Commit Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CustomerPage;
