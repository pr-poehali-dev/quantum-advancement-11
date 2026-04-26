import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

interface Props {
  nickname: string
  customerCode: string
}

export default function CustomerIdCard({ nickname, customerCode }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-orange-500/40 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200 flex items-center gap-2"
      >
        <Icon name="QrCode" size={16} />
        Моё удостоверение
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-[#1a1410] border border-orange-500/30 rounded-2xl p-6 max-w-xs w-full shadow-2xl shadow-orange-900/30"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
            >
              <Icon name="X" size={18} />
            </button>

            <div className="text-center mb-5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Клиентское удостоверение</p>
              <h2 className="text-white font-bold text-lg">{nickname}</h2>
            </div>

            <div className="flex justify-center mb-5">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG
                  value={customerCode}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#1a0800"
                  level="M"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-white/40 text-xs mb-1">Ваш номер</p>
              <p className="text-orange-400 font-mono text-2xl font-bold tracking-widest">{customerCode}</p>
            </div>

            <p className="text-white/30 text-xs text-center mt-4 leading-relaxed">
              Предъявите QR-код или номер на пункте выдачи для получения заказа
            </p>
          </div>
        </div>
      )}
    </>
  )
}
