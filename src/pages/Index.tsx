import Header from "@/components/Header";
import ContractCard from "@/components/ContractCard";

const contracts = [
  { title: "Lumni Menores de edad", route: "/lumni-menores" },
  { title: "Lumni Mayores de edad", route: "/lumni-mayores" },
  { title: "Recursos Propios Menores de edad", route: "/rp-menores" },
  { title: "Recursos Propios Mayores de edad", route: "/rp-mayores" },
  { title: "Pronto Pago Menores de edad", route: "/pp-menores" },
  { title: "Pronto Pago Mayores de edad", route: "/pp-mayores" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Automatización de Contratos
          </h1>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto space-y-12">
          {/* Sección Lumni */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary"></span>
              CONTRATOS LUMNI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contracts.filter(c => c.title.includes("Lumni")).map((contract, index) => (
                <ContractCard
                  key={index}
                  title={contract.title}
                  route={contract.route}
                />
              ))}
            </div>
          </div>

          {/* Sección Recursos Propios */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary"></span>
              CONTRATOS RECURSOS PROPIOS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contracts.filter(c => c.title.includes("Recursos Propios")).map((contract, index) => (
                <ContractCard
                  key={index}
                  title={contract.title}
                  route={contract.route}
                />
              ))}
            </div>
          </div>

          {/* Sección Pronto Pago */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary"></span>
              CONTRATOS PRONTO PAGO
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contracts.filter(c => c.title.includes("Pronto Pago")).map((contract, index) => (
                <ContractCard
                  key={index}
                  title={contract.title}
                  route={contract.route}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="#" className="hover:text-foreground transition-colors">Términos</a>
              <a href="#" className="hover:text-foreground transition-colors">Soporte</a>
            </div>
            <p className="text-xs text-muted-foreground tracking-wider">
              © 2026 CAMPUSLANDS • SECURE ENVIRONMENT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
