t_world{
  //#define LIKE_INT(F)F(t_wms_id)F(t_dir_id)F(t_oper_id)
  t_wms{
    t_wms_id id;
    string name;
  };
  t_dir{
    t_dir_id id;
    t_wms_id from;
    t_wms_id to;
    vector<t_dir_rec> arr;
  };
  t_amount_with_wms{
    t_wms_id id;
    t_amount value;
  }
  t_oper{
    t_oper_id oper_id;
    t_amount_with_wms from;
    t_amount_with_wms to;
    t_wm_timestamp time;
  };
  vector<t_oper> opers;
  t_dir_rec{
    bool is_our(t_context);
    t_oper_id oper_id;
    t_amount amountin;
    t_amount amountout;
    t_wm_timestamp time;
  };
  //vector<t_oper_id> our_opers; bool is_our(t_oper_id oper_id);
  
  vector<t_wms> wms;
  vector<t_dir> dirs;
  t_move_split{
    t_oper_id src_oper_id; // src_oper_id=dirs[$].arr[$].oper_id; assert(is_our(src_oper_id));
    t_wms_id out_wms_id; // out_wms_id=wms[$].id;
    t_amount amountin; // amountin=get(src_oper_id).amountin-$; assert(amountin>0.01);
    t_amount amountout; // amountin=get(src_oper_id).amountin;
  };
  void gen(vector<t_move_split>&out){
    
  }
  void use(t_move_split m){
    m.
  }
}