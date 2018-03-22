void update(){
  t_world w;
  system("node fetch_world.js");
  system("node conv_world_to_bin.js");
  system("node conv_oper_id_to_local_oper_id.js");
  QapLoadFromFile(w,"world.bin");
  t_nbf nbf;
  nbf.depth=$;
  nbf.build_tree();
  auto node_id=QAP_MINVAL_ID_OF_VEC(nbf.nodes,ex.escore-ex.score);
  auto root_move=nbf.get_root_move_from(node_id);
  move=root_move.get_move();
  domove(move);
}